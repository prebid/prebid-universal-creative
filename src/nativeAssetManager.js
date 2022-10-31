/**
 * Handles postMessage requests and responses for replacing native placeholder
 * values in native creative templates.
 */

import { addNativeClickTrackers, fireNativeImpressionTrackers } from './nativeORTBTrackerManager';
import { sendRequest, loadScript } from './utils';
import {prebidMessenger} from './messaging.js';
import { isSafeFrame } from './environment.js';
/*
 * Native asset->key mapping from Prebid.js/src/constants.json
 * https://github.com/prebid/Prebid.js/blob/8635c91942de9df4ec236672c39b19448545a812/src/constants.json#L67
 */
const NATIVE_KEYS = {
  title: 'hb_native_title',
  body: 'hb_native_body',
  body2: 'hb_native_body2',
  privacyLink: 'hb_native_privacy',
  sponsoredBy: 'hb_native_brand',
  image: 'hb_native_image',
  icon: 'hb_native_icon',
  clickUrl: 'hb_native_linkurl',
  displayUrl: 'hb_native_displayurl',
  cta: 'hb_native_cta',
  rating: 'hb_native_rating',
  address: 'hb_native_address',
  downloads: 'hb_native_downloads',
  likes: 'hb_native_likes',
  phone: 'hb_native_phone',
  price: 'hb_native_price',
  salePrice: 'hb_native_saleprice',
  rendererUrl: 'hb_renderer_url',
};

// Asset type mapping as per Native IAB spec 1.2
// https://www.iab.com/wp-content/uploads/2017/04/OpenRTB-Native-Ads-Specification-Draft_1.2_2017-04.pdf#page=40
const assetTypeMapping = {
  'image': {
    1: 'icon',
    3: 'image'
  },
  'data': {
    1: 'sponsoredBy',
    2: 'body',
    3: 'rating',
    4: 'likes',
    5: 'downloads',
    6: 'price',
    7: 'salePrice',
    8: 'phone',
    9: 'address',
    10: 'body2',
    11: 'displayUrl',
    12: 'cta',
  }
}

const DEFAULT_CACHE_HOST = 'prebid.adnxs.com';
const DEFAULT_CACHE_PATH = '/pbc/v1/cache';

export function newNativeAssetManager(win, pubUrl) {
  const sendMessage = prebidMessenger(pubUrl, win);
  let callback;
  let errorCountEscapeHatch = 0;
  let cancelMessageListener;

  function stopListening() {
    if (cancelMessageListener != null) {
      cancelMessageListener();
      cancelMessageListener = null;
    }
  }

  function getCacheEndpoint(cacheHost, cachePath) {
    let host = (typeof cacheHost === 'undefined' || cacheHost === "") ? DEFAULT_CACHE_HOST : cacheHost;
    let path = (typeof cachePath === 'undefined' || cachePath === "") ? DEFAULT_CACHE_PATH : cachePath;

    return `https://${host}${path}`;
  }

  function parseResponse(response) {
    let bidObject;
    try {
      bidObject = JSON.parse(response);
    } catch (error) {
      console.log(`Error parsing response from cache host: ${error}`);
    }
    return bidObject;
  }

  function transformToPrebidKeys(adMarkup) {
    let assets = [];
    let clicktrackers;
    let assetsFromMarkup = adMarkup.assets;
    assetsFromMarkup.forEach((asset) => {
      if (asset.img) {
        if (assetTypeMapping['image'][asset.img.type]) {
          assets.push({
            'key' : assetTypeMapping['image'][asset.img.type],
            'value' : asset.img.url
          })
        } else {
          console.log('ERROR: Invalid image type for image asset');
        }
      } else if (asset.data) {
        if (assetTypeMapping['data'][asset.data.type]) {
          assets.push({
            'key' : assetTypeMapping['data'][asset.data.type],
            'value' : asset.data.value
          })
        } else {
          console.log('ERROR: Invalid data type for data asset');
        }
      } else if (asset.title) {
        assets.push({
          'key' : 'title',
          'value' : asset.title.text
        })
      }
    })

    if (adMarkup.link) {
      if (adMarkup.link.clicktrackers) {
        clicktrackers = adMarkup.link.clicktrackers;
      }
      assets.push({
        'key' : 'clickUrl',
        'value' : adMarkup.link.url
      })
    }

    return {
      assets,
      clicktrackers,
      'imptrackers' : adMarkup.imptrackers,
      'eventtrackers': adMarkup.eventtrackers
    }
  }

  function requestAssetsFromCache(tagData) {
    let ajaxCallback = function(response) {
      let bidResponse = parseResponse(response);
      if (bidResponse && bidResponse.adm) {
        let markup = parseResponse(bidResponse.adm);
        if (markup && markup.assets) {
          let data = transformToPrebidKeys(markup);
          const body = win.document.body.innerHTML;
          const newHtml = replace(body, data);
          win.document.body.innerHTML = newHtml;

          callback && callback({
            clickTrackers: data.clicktrackers,
            impTrackers: data.imptrackers,
            eventtrackers: data.eventtrackers
          });
        } else {
          // TODO Shall we just write the markup in the page
        }
      }
    }
    let uuid = tagData.uuid;
    let adUrl = `${getCacheEndpoint(tagData.cacheHost, tagData.cachePath)}?uuid=${uuid}`;
    sendRequest(adUrl, ajaxCallback);
  }

  function loadMobileAssets(tagData, cb) {
    const placeholders = scanDOMForPlaceHolders();
    if (placeholders.length > 0) {
      callback = cb;
      requestAssetsFromCache(tagData);
    }
  }

  function hasPbNativeData() {
    return typeof win.pbNativeData !== 'undefined'
  }

  /*
   * Entry point to search for placeholderes and set up postmessage roundtrip
   * to retrieve native assets. Looks for placeholders for the given adId and
   * fires a callback after the native html is updated. If no placeholders found
   * and requestAllAssets flag is set in the tag, postmessage roundtrip
   * to retrieve native assets that have a value on the corresponding bid
   */
  function loadAssets(adId, cb) {
    const placeholders = scanDOMForPlaceHolders(adId);

    if (hasPbNativeData() && win.pbNativeData.hasOwnProperty('assetsToReplace')) {
        win.pbNativeData.assetsToReplace.forEach((asset) => {
          const key = (asset.match(/hb_native_/i)) ? asset : NATIVE_KEYS[asset];
          if (key) {placeholders.push(key);}
        });
    }

    if (hasPbNativeData() && win.pbNativeData.hasOwnProperty('requestAllAssets') && win.pbNativeData.requestAllAssets) {
      callback = cb;
      cancelMessageListener = requestAllAssets(adId);
    } else if (placeholders.length > 0) {
      callback = cb;
      cancelMessageListener = requestAssets(adId, placeholders);
    }
  }

  function placeholderFor(key, adId) {
    return (adId && !hasPbNativeData()) ? `${key}:${adId}` : ((hasPbNativeData()) ? `##${key}##` : key)
  }

  function scanForPlaceHolders(adId, ...markupFragments) {
    return Object.values(NATIVE_KEYS)
        .reduce((found, key) => {
          const placeholder = placeholderFor(key, adId);
          for (const mkup of markupFragments.filter(Boolean)) {
            if (mkup.indexOf(placeholder) >= 0) {
              found.push(key);
              break;
            }
          }
          return found;
        }, []);
  }

  /*
   * Searches the DOM for legacy placeholder values sent in by Prebid Native
   */
  function scanDOMForPlaceHolders(adId) {
    return scanForPlaceHolders(adId, win.document.body.innerHTML, win.document.head.innerHTML);
  }

  /*
   * Sends postmessage to Prebid for asset placeholders found in the native
   * creative template, and setups up a listener for when Prebid responds.
   */
  function requestAssets(adId, assets) {
    const message = {
      message: 'Prebid Native',
      action: 'assetRequest',
      adId,
      assets,
    };

    return sendMessage(message, replaceAssets);
  }

  /*
   * Sends postmessage to Prebid for asset placeholders found in the native
   * creative template, and setups up a listener for when Prebid responds.
   */
  function requestAllAssets(adId) {
    const message = {
      message: 'Prebid Native',
      action: 'allAssetRequest',
      adId,
    };
    return sendMessage(message, replaceAssets);
  }

  /*
   * Sends postmessage to Prebid for native resize
   */
  function requestHeightResize(adId, height, width) {
    const message = {
      message: 'Prebid Native',
      action: 'resizeNativeHeight',
      adId,
      height,
      width
    };
    sendMessage(message);
  }

  /*
   * Postmessage listener for when Prebid responds with requested native assets.
   */
  function replaceAssets(event) {
    var data = {};

    try {
      data = JSON.parse(event.data);
    } catch (e) {
      if (errorCountEscapeHatch++ > 10) {
        /*
         * if for some reason Prebid never responds with the native assets,
         * get rid of this listener because other messages won't stop coming
         */
        stopListening();
      }
      return;
    }

    if (data.message === 'assetResponse') {
      const body = win.document.body.innerHTML;
      const head = win.document.head.innerHTML;

      if (hasPbNativeData() && data.adId !== win.pbNativeData.adId) return;

      if (head) win.document.head.innerHTML = replace(head, data);

      data.assets = data.assets || [];
      let renderPayload = data.assets;
      if (data.ortb) {
        renderPayload.ortb = data.ortb;
        callback = () => {
          fireNativeImpressionTrackers(data.adId, sendMessage);
          addNativeClickTrackers(data.adId, data.ortb, sendMessage);
        }
      }

      if ((data.hasOwnProperty('rendererUrl') && data.rendererUrl) || (hasPbNativeData() && win.pbNativeData.hasOwnProperty('rendererUrl'))) {
        if (win.renderAd) {
          const newHtml = (win.renderAd && win.renderAd(renderPayload)) || '';

          renderAd(newHtml, data);
        } else if (document.getElementById('pb-native-renderer')) {
          document.getElementById('pb-native-renderer').addEventListener('load', function() {
            const newHtml = (win.renderAd && win.renderAd(renderPayload)) || '';

            renderAd(newHtml, data);
          });
        } else {
          loadScript(win, ((hasPbNativeData() && win.pbNativeData.hasOwnProperty('rendererUrl') && win.pbNativeData.rendererUrl) || data.rendererUrl), function() {
            const newHtml = (win.renderAd && win.renderAd(renderPayload)) || '';

            renderAd(newHtml, data);
          })
        }
      } else if ((data.hasOwnProperty('adTemplate') && data.adTemplate)||(hasPbNativeData() && win.pbNativeData.hasOwnProperty('adTemplate'))) {
        const template =  (hasPbNativeData() && win.pbNativeData.hasOwnProperty('adTemplate') && win.pbNativeData.adTemplate) || data.adTemplate;
        const newHtml = replace(template, data);
        
        renderAd(newHtml, data);
      } else {
        const newHtml = replace(body, data);

        win.document.body.innerHTML = newHtml;
        callback && callback();
        stopListening();
      }
    }
  }

  /** This function returns the element that contains the current iframe. */
  function getCurrentFrameContainer(win) {
    let currentWindow = win;
    let currentParentWindow;

    while (currentWindow !== win.top) {
        currentParentWindow = currentWindow.parent;
        if (!currentParentWindow.frames || !currentParentWindow.frames.length) return null;
        for (let idx = 0; idx < currentParentWindow.frames.length; idx++)
            if (currentParentWindow.frames[idx] === currentWindow) {
              if (!currentParentWindow.document) return null; 
                for (let frameElement of currentParentWindow.document.getElementsByTagName('iframe')) {
                    if (!frameElement.contentWindow) return null;
                    if (frameElement.contentWindow === currentWindow) {
                        return frameElement.parentElement;
                    }
                }
            }
    }
}

  function renderAd(html, bid) {
    // if the current iframe is not a safeframe, try to set the
    // current iframe width to the width of the container. This
    // is to handle the case where the native ad is rendered inside
    // a GAM display ad.
    if (!isSafeFrame(window)) {
      let iframeContainer = getCurrentFrameContainer(win);
      if (iframeContainer && iframeContainer.children && iframeContainer.children[0]) {
        const iframe = iframeContainer.children[0]; 
        if (iframe.width === '1' && iframe.height === '1') {
          let width =  iframeContainer.getBoundingClientRect().width;
          win.document.body.style.width = `${width}px`;
        }
      }
    }
    win.document.body.innerHTML += html;
    callback && callback();
    win.removeEventListener('message', replaceAssets);
    stopListening();
    requestHeightResize(bid.adId, (document.body.clientHeight || document.body.offsetHeight), document.body.clientWidth);

    if (typeof window.postRenderAd === 'function') {
      window.postRenderAd(bid);
    }
  }

  function replaceORTBAssetsAndLinks(html, ortb) {

    const getAssetValue = (asset) => {
      if (asset.img) {
        return asset.img.url;
      }
      if (asset.data) {
        return asset.data.value;
      }
      if (asset.title) {
        return asset.title.text;
      }
      if (asset.video) {
        return asset.video.vasttag;
      }
      return ''
    }

    ortb.assets.forEach(asset => {
      html = html.replace(`##hb_native_asset_id_${asset.id}##`, getAssetValue(asset));
      if (asset.link && asset.link.url) {
        html = html.replace(`##hb_native_asset_link_id_${asset.id}##`, asset.link.url);
      }
    });

    html = html.replaceAll(/##hb_native_asset_id_\d+##/gm, '');

    if (ortb.privacy) {
      html = html.replace("##hb_native_privacy##", ortb.privacy);
    }

    if (ortb.link) {
      html = html.replaceAll("##hb_native_linkurl##", ortb.link.url);
    }
  
    return html;
  }

  /**
   * Replaces occurrences of native placeholder values with their actual values
   * in the given document.
   * If there's no actual value, the placeholder gets replaced by an empty string.
   */
  function replace(html, { assets, ortb, adId }) {
    if (ortb) {
      html = replaceORTBAssetsAndLinks(html, ortb);
    } else if (!Array.isArray(assets)) {
      return html;
    }
    assets = assets || [];

    scanForPlaceHolders(adId, html).forEach(placeholder => {
      const searchString = placeholderFor(placeholder, adId);
      const searchStringRegex = new RegExp(searchString, 'g');
      const fittingAsset = assets.find(asset => placeholder === NATIVE_KEYS[asset.key]);
      html = html.replace(searchStringRegex, fittingAsset ? fittingAsset.value : '');
    })

    return html;
  }

  return {
    loadAssets,
    loadMobileAssets
  };
}
