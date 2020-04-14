import * as utils from './utils';
import * as domHelper from './domHelper';
import {triggerPixel} from './utils';

const GOOGLE_IFRAME_HOSTNAME = 'tpc.googlesyndication.com';
const DEFAULT_CACHE_HOST = 'prebid.adnxs.com';
const DEFAULT_CACHE_PATH = '/pbc/v1/cache';

/**
 * 
 * @param {Object} win Window object
 * @param {Object} environment Environment object
 * @returns {Object} 
 */
export function newRenderingManager(win, environment) {
  /**
   * DataObject passed to render the ad
   * @typedef {Object} dataObject
   * @property {string} host - Prebid cache host
   * @property {string} uuid - ID to fetch the value from prebid cache
   * @property {string} mediaType - Creative media type, It can be banner, native or video
   * @property {string} pubUrl - Publisher url
   *
   * @property {string} winurl
   * @property {string} winbidid
   */

  /**
   * Public render ad function to be used in dfp creative setup
   * @param  {object} doc
   * @param  {dataObject} dataObject
   */
  let renderAd = function(doc, dataObject) {
    const targetingData = utils.transformAuctionTargetingData(dataObject);
    
    if (environment.isMobileApp(targetingData.env)) {
      renderAmpOrMobileAd(targetingData.cacheHost, targetingData.cachePath, targetingData.uuid, targetingData.size, targetingData.hbPb, true);
    } else if (environment.isAmp(targetingData.uuid)) {
      renderAmpOrMobileAd(targetingData.cacheHost, targetingData.cachePath, targetingData.uuid, targetingData.size, targetingData.hbPb);
    } else if (!environment.canLocatePrebid()) {
      renderCrossDomain(targetingData.adId, targetingData.adServerDomain, targetingData.pubUrl);
    } else {
      renderLegacy(doc, targetingData.adId);
    }
  };

  /**
   * Calls prebid.js renderAd function to render ad
   * @param {Object} doc Document
   * @param {string} adId Id of creative to render
   */
  function renderLegacy(doc, adId) {
    let w = win;
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
  function renderCrossDomain(adId, pubAdServerDomain = '', pubUrl) {
    let windowLocation = window.location;
    let parsedUrl = utils.parseUrl(pubUrl);
    let publisherDomain = parsedUrl.protocol + '://' + parsedUrl.host;
    let adServerDomain = pubAdServerDomain || GOOGLE_IFRAME_HOSTNAME;
    let fullAdServerDomain = windowLocation.protocol + '//' + adServerDomain;

    function renderAd(ev) {
      let key = ev.message ? 'message' : 'data';
      let adObject = {};
      try {
        adObject = JSON.parse(ev[key]);
      } catch (e) {
        return;
      }

      let origin = ev.origin || ev.originalEvent.origin;
      if (adObject.message && adObject.message === 'Prebid Response' &&
          publisherDomain === origin &&
          adObject.adId === adId &&
          (adObject.ad || adObject.adUrl)) {
        let body = win.document.body;
        let ad = adObject.ad;
        let url = adObject.adUrl;
        let width = adObject.width;
        let height = adObject.height;

        if (adObject.mediaType === 'video') {
          console.log('Error trying to write ad.');
        } else if (ad) {
          const iframe =  domHelper.getEmptyIframe(adObject.height, adObject.width);
          body.appendChild(iframe);
          iframe.contentDocument.open();
          iframe.contentDocument.write(ad);
          iframe.contentDocument.close();
        } else if (url) {
          const iframe = domHelper.getEmptyIframe(height, width);
          iframe.style.display = 'inline';
          iframe.style.overflow = 'hidden';
          iframe.src = url;

          domHelper.insertElement(iframe, document, 'body');
        } else {
          console.log(`Error trying to write ad. No ad for bid response id: ${id}`);
        }
      }
    }

    function requestAdFromPrebid() {
      let message = JSON.stringify({
        message: 'Prebid Request',
        adId: adId,
        adServerDomain: fullAdServerDomain
      });
      win.parent.postMessage(message, publisherDomain);
    }

    function listenAdFromPrebid() {
      win.addEventListener('message', renderAd, false);
    }

    listenAdFromPrebid();
    requestAdFromPrebid();
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
   * Render mobile or amp ad
   * @param {string} cacheHost Cache host
   * @param {string} cachePath Cache path
   * @param {string} uuid id to render response from cache endpoint
   * @param {string} size size of the creative
   * @param {string} hbPb final price of the winning bid
   * @param {Bool} isMobileApp flag to detect mobile app
   */
  function renderAmpOrMobileAd(cacheHost, cachePath, uuid = '', size, hbPb, isMobileApp) {
    // For MoPub, creative is stored in localStorage via SDK.
    let search = 'Prebid_';
    if(uuid.substr(0, search.length) === search) {
      loadFromLocalCache(uuid)
    } else {
      let adUrl = `${getCacheEndpoint(cacheHost, cachePath)}?uuid=${uuid}`;

      //register creative right away to not miss initial geom-update
      if (typeof size !== 'undefined' && size !== "") {
        let sizeArr = size.split('x').map(Number);
        resizeIframe(sizeArr[0], sizeArr[1]);
      } else {
        console.log('Targeting key hb_size not found to resize creative');
      }
      utils.sendRequest(adUrl, responseCallback(isMobileApp, hbPb));
    }
  }

  /**
   * Cache request Callback to display creative
   * @param {Bool} isMobileApp
   * @param {string} hbPb final price of the winning bid
   * @returns {function} a callback function that parses response
   */
  function responseCallback(isMobileApp, hbPb) {
    return function(response) {
      let bidObject = parseResponse(response);
      let ad = utils.getCreativeCommentMarkup(bidObject);
      let width = (bidObject.width) ? bidObject.width : bidObject.w;
      let height = (bidObject.height) ? bidObject.height : bidObject.h;

      // When Prebid Universal Creative reads from Prebid Cache, we need to have it check for the existence of the wurl parameter. If it exists, hit it.
      if (bidObject.wurl) {
        triggerPixel(decodeURIComponent(bidObject.wurl));
      }

      if (bidObject.adm) {
        if(hbPb) { // replace ${AUCTION_PRICE} macro with the hb_pb.
          bidObject.adm = bidObject.adm.replace('${AUCTION_PRICE}', hbPb);
        } else {
          /*
            From OpenRTB spec 2.5: If the source value is an optional parameter that was not specified, the macro will simply be removed (i.e., replaced with a zero-length string).
           */
          bidObject.adm = bidObject.adm.replace('${AUCTION_PRICE}', '');
        }
        ad += (isMobileApp) ? constructMarkup(bidObject.adm, width, height) : bidObject.adm;
        if (bidObject.nurl) {
          ad += utils.createTrackPixelHtml(decodeURIComponent(bidObject.nurl));
        }
        utils.writeAdHtml(ad);
      } else if (bidObject.nurl) {
        if(isMobileApp) {
          let adhtml = utils.loadScript(win, bidObject.nurl);
          ad += constructMarkup(adhtml.outerHTML, width, height);
          utils.writeAdHtml(ad);
        } else {
          let nurl = bidObject.nurl;
          let commentElm = utils.getCreativeComment(bidObject);
          domHelper.insertElement(commentElm, document, 'body');
          utils.writeAdUrl(nurl, width, height);
        }
      }
      if (bidObject.burl) {
        utils.triggerBurl(bidObject.burl);
      }
    }
  };

  /**
   * Load response from localStorage. In case of MoPub, sdk caches response
   * @param {string} cacheId 
   */
  function loadFromLocalCache(cacheId) {
    let bid = win.localStorage.getItem(cacheId);
    let displayFn = responseCallback(true);
    displayFn(bid);
  }

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
    let id = utils.getUUID();
    return `<div id="${id}" style="border-style: none; position: absolute; width:100%; height:100%;">
      <div id="${id}_inner" style="margin: 0 auto; width:${width}; height:${height}; position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);">${ad}</div>
      </div>`;
  }

  /**
   * Resize container iframe
   * @param {Number} width width of creative
   * @param {Number} height height of creative
   */
  function resizeIframe(width, height) {
    if (environment.isSafeFrame()) {
      const iframeWidth = win.innerWidth;
      const iframeHeight = win.innerHeight;

      function resize(status) {
        let newWidth = width - iframeWidth;
        let newHeight = height - iframeHeight;
        win.$sf.ext.expand({r:newWidth, b:newHeight, push: true});
      }

      if (iframeWidth !== width || iframeHeight !== height) {
        win.$sf.ext.register(width, height, resize);
        // we need to resize the DFP container as well
        win.parent.postMessage({
          sentinel: 'amp',
          type: 'embed-size',
          width: width,
          height: height
        }, '*');
      }
    }
  }

  return {
    renderAd
  }
}
