import { getCreativeCommentMarkup, triggerPixel, createTrackPixelHtml, loadScript, writeAdHtml, getCreativeComment, writeAdUrl, transformAuctionTargetingData, sendRequest, getUUID, parseUrl } from './utils';
import { isSafeFrame, canLocatePrebid } from './environment';
import { insertElement, getEmptyIframe } from './domHelper';
import {prebidMessenger} from './messaging.js';

const DEFAULT_CACHE_HOST = 'prebid.adnxs.com';
const DEFAULT_CACHE_PATH = '/pbc/v1/cache';

/**
 * Render mobile or amp ad
 * @param {string} cacheHost Cache host
 * @param {string} cachePath Cache path
 * @param {string} uuid id to render response from cache endpoint
 * @param {string} size size of the creative
 * @param {string} hbPb final price of the winning bid
 * @param {Bool} isMobileApp flag to detect mobile app
 */
 export function renderAmpOrMobileAd(dataObject, isMobileApp) {
  const targetingData = transformAuctionTargetingData(dataObject);
  let { cacheHost, cachePath, uuid, size, hbPb } = targetingData;
  uuid = uuid || '';
  // For MoPub, creative is stored in localStorage via SDK.
  let search = 'Prebid_';
  if (uuid.substr(0, search.length) === search) {
    loadFromLocalCache(uuid);
    //register creative right away to not miss initial geom-update
    updateIframe(size);
  } else {
    let adUrl = `${getCacheEndpoint(cacheHost, cachePath)}?uuid=${uuid}`;
    //register creative right away to not miss initial geom-update
    updateIframe(size);
    sendRequest(adUrl, responseCallback(isMobileApp, hbPb));
  }
}

export function renderBannerOrDisplayAd(doc, dataObject) {
  const targetingData = transformAuctionTargetingData(dataObject);

  if (!canLocatePrebid(window)) {
    renderCrossDomain(targetingData.adId, targetingData.adServerDomain, targetingData.pubUrl);
  } else {
    renderLegacy(doc, targetingData.adId);
  }
}

/**
 * Load response from localStorage. In case of MoPub, sdk caches response
 * @param {string} cacheId
 */
function loadFromLocalCache(cacheId) {
  let bid = window.localStorage.getItem(cacheId);
  let displayFn = responseCallback(true);
  displayFn(bid);
}

/**
 * update iframe by using size string to resize
 * @param {string} size
 */
function updateIframe(size) {
  if (size) {
    const sizeArr = size.split('x').map(Number);
    resizeIframe(sizeArr[0], sizeArr[1]);
  } else {
    console.log('Targeting key hb_size not found to resize creative');
  }
}

/**
 * Resize container iframe
 * @param {Number} width width of creative
 * @param {Number} height height of creative
 */
function resizeIframe(width, height) {
  if (isSafeFrame(window)) {
    const iframeWidth = window.innerWidth;
    const iframeHeight = window.innerHeight;

    function resize(status) {
      let newWidth = width - iframeWidth;
      let newHeight = height - iframeHeight;
      window.$sf.ext.expand({ r: newWidth, b: newHeight, push: true });
    }

    if (iframeWidth !== width || iframeHeight !== height) {
      window.$sf.ext.register(width, height, resize);
      // we need to resize the DFP container as well
      window.parent.postMessage({
        sentinel: 'amp',
        type: 'embed-size',
        width: width,
        height: height
      }, '*');
    }
  }
}

/**
 * Returns cache endpoint concatenated with cache path
 * @param {string} cacheHost Cache Endpoint host
 * @param {string} cachePath Cache Endpoint path
 */
function getCacheEndpoint(cacheHost, cachePath) {
  let host = (typeof cacheHost === 'undefined' || cacheHost === "") ? DEFAULT_CACHE_HOST : cacheHost;
  let path = (typeof cachePath === 'undefined' || cachePath === "") ? DEFAULT_CACHE_PATH : cachePath;

  return `https://${host}${path}`;
}


/**
 * Cache request Callback to display creative
 * @param {Bool} isMobileApp
 * @param {string} hbPb final price of the winning bid
 * @returns {function} a callback function that parses response
 */
function responseCallback(isMobileApp, hbPb) {
  return function (response) {
    let bidObject = parseResponse(response);
    let auctionPrice = bidObject.price || hbPb;
    let ad = getCreativeCommentMarkup(bidObject);
    let width = (bidObject.width) ? bidObject.width : bidObject.w;
    let height = (bidObject.height) ? bidObject.height : bidObject.h;

    // When Prebid Universal Creative reads from Prebid Cache, we need to have it check for the existence of the wurl parameter. If it exists, hit it.
    if (bidObject.wurl) {
      triggerPixel(decodeURIComponent(bidObject.wurl));
    }

    if (bidObject.adm) {
      if (auctionPrice) { // replace ${AUCTION_PRICE} macro with the bidObject.price or hb_pb.
        bidObject.adm = bidObject.adm.replace('${AUCTION_PRICE}', auctionPrice);
      } else {
        /*
          From OpenRTB spec 2.5: If the source value is an optional parameter that was not specified, the macro will simply be removed (i.e., replaced with a zero-length string).
         */
        bidObject.adm = bidObject.adm.replace('${AUCTION_PRICE}', '');
      }
      ad += (isMobileApp) ? constructMarkup(bidObject.adm, width, height) : bidObject.adm;
      if (bidObject.nurl) {
        ad += createTrackPixelHtml(decodeURIComponent(bidObject.nurl));
      }
      if (bidObject.burl) {
        let triggerBurl = function () { triggerPixel(bidObject.burl); };
        if (isMobileApp) {
          let mraidScript = loadScript(window, 'mraid.js',
            function () { // Success loading MRAID
              let result = registerMRAIDViewableEvent(triggerBurl);
              if (!result) {
                triggerBurl(); // Error registering event
              }
            },
            triggerBurl // Error loading MRAID
          );
        } else {
          triggerBurl(); // Not a mobile app
        }
      }
      writeAdHtml(ad);
    } else if (bidObject.nurl) {
      if (isMobileApp) {
        let adhtml = loadScript(window, bidObject.nurl);
        ad += constructMarkup(adhtml.outerHTML, width, height);
        writeAdHtml(ad);
      } else {
        let nurl = bidObject.nurl;
        let commentElm = getCreativeComment(bidObject);
        insertElement(commentElm, document, 'body');
        writeAdUrl(nurl, width, height);
      }
    }
  }
};

/**
 * Parse response
 * @param {string} response
 * @returns {Object} bidObject parsed response
 */
function parseResponse(response) {
  let bidObject;
  try {
    bidObject = JSON.parse(response);
  } catch (error) {
    console.log(`Error parsing response from cache host: ${error}`);
  }
  return bidObject;
}

/**
 * Wrap mobile app creative in div
 * @param {string} ad html for creative
 * @param {Number} width width of creative
 * @param {Number} height height of creative
 * @returns {string} creative markup
 */
function constructMarkup(ad, width, height) {
  let id = getUUID();
  return `<div id="${id}" style="border-style: none; position: absolute; width:100%; height:100%;">
      <div id="${id}_inner" style="margin: 0 auto; width:${width}px; height:${height}px; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">${ad}</div>
      </div>`;
}


function registerMRAIDViewableEvent(callback) {

  function exposureChangeListener(exposure) {
    if (exposure > 0) {
      mraid.removeEventListener('exposureChange', exposureChangeListener);
      callback();
    }
  }

  function viewableChangeListener(viewable) {
    if (viewable) {
      mraid.removeEventListener('viewableChange', viewableChangeListener);
      callback();
    }
  }

  function registerViewableChecks() {
    if (window.MRAID_ENV && parseFloat(window.MRAID_ENV.version) >= 3) {
      mraid.addEventListener('exposureChange', exposureChangeListener);
    } else if(window.MRAID_ENV && parseFloat(window.MRAID_ENV.version) < 3) {
      if (mraid.isViewable()) {
        callback();
      } else {
        mraid.addEventListener('viewableChange', viewableChangeListener);
      }
    }
  }

  function readyListener() {
    mraid.removeEventListener('ready', readyListener);
    registerViewableChecks();
  }

  if (window.mraid && window.MRAID_ENV) {
    if (mraid.getState() == 'loading') {
      mraid.addEventListener('ready', readyListener);
    } else {
      registerViewableChecks();
    }
    return true;
  } else {
    return false;
  }
}


/**
 * Calls prebid.js renderAd function to render ad
 * @param {Object} doc Document
 * @param {string} adId Id of creative to render
 */
 export function renderLegacy(doc, adId) {
  let w = window;
  for (let i = 0; i < 10; i++) {
    w = w.parent;
    if (w.$$PREBID_GLOBAL$$) {
      try {
        w.$$PREBID_GLOBAL$$.renderAd(doc, adId);
        break;
      } catch (e) {
        continue;
      }
    }
  }
}

/**
 * Render ad in safeframe using postmessage
 * @param {string} adId Id of creative to render
 * @param {string} pubAdServerDomain publisher adserver domain name
 * @param {string} pubUrl Url of publisher page
 */
export function renderCrossDomain(adId, pubAdServerDomain = '', pubUrl) {
  let windowLocation = window.location;
  let adServerDomain = pubAdServerDomain || window.location.hostname;
  let fullAdServerDomain = windowLocation.protocol + '//' + adServerDomain;
  const sendMessage = prebidMessenger(pubUrl, win);

  function renderAd(ev) {
    let key = ev.message ? 'message' : 'data';
    let adObject = {};
    try {
      adObject = JSON.parse(ev[key]);
    } catch (e) {
      return;
    }

    if (adObject.message && adObject.message === 'Prebid Response' &&
      adObject.adId === adId &&
      (adObject.ad || adObject.adUrl)) {
      let body = window.document.body;
      let ad = adObject.ad;
      let url = adObject.adUrl;
      let width = adObject.width;
      let height = adObject.height;

      if (adObject.mediaType === 'video') {
        console.log('Error trying to write ad.');
      } else if (ad) {
        const iframe = getEmptyIframe(adObject.height, adObject.width);
        body.appendChild(iframe);
        iframe.contentDocument.open();
        iframe.contentDocument.write(ad);
        iframe.contentDocument.close();
      } else if (url) {
        const iframe = getEmptyIframe(height, width);
        iframe.style.display = 'inline';
        iframe.style.overflow = 'hidden';
        iframe.src = url;

        insertElement(iframe, document, 'body');
      } else {
        console.log(`Error trying to write ad. No ad for bid response id: ${id}`);
      }
    }
  }

  function signalRenderResult(success, { reason, message } = {}) {
    const payload = {
      message: 'Prebid Event',
      adId,
      event: success ? 'adRenderSucceeded' : 'adRenderFailed',
    };
    if (!success) {
      payload.info = { reason, message };
    }
    sendMessage(payload);
  }

  function requestAdFromPrebid() {
    let message = {
      message: 'Prebid Request',
      adId: adId,
      adServerDomain: fullAdServerDomain
    }
    sendMessage(message, renderAd);
  }

  requestAdFromPrebid();
}
