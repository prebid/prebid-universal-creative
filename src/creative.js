/**
 * creative.js
 *
 * This file is inserted into the prebid creative as a placeholder for the winning prebid creative. It should support the following formats:
 * - Banner
 * - Outstream Video
 * - Mobile
 * - AMP creatives
 * - All safeFrame creatives
 */

import * as utils from './utils';
import * as environment from './environment';

const pbjs = window.pbjs = (window.pbjs || {});
const GOOGLE_IFRAME_HOSTNAME = '//tpc.googlesyndication.com';
const DEFAULT_CACHE_HOST = 'prebid.adnxs.com';
const DEFAULT_CACHE_PATH = '/pbc/v1/cache';

/**
 * DataObject passed to render the ad
 * @typedef {Object} dataObject
 * @property {string} host - Prebid cache host
 * @property {string} uuid - ID to fetch the value from prebid cache
 * @property {string} mediaType - Creative media type, It can be banner, native or video
 * @property {string} pubUrl - Publisher url
 */

/**
 * Public render ad function to be used in dfp creative setup
 * @param  {object} doc
 * @param  {string} adId
 * @param  {dataObject} dataObject
 */
pbjs.renderAd = function(doc, adId, dataObject) {
  if(environment.isMobileApp(dataObject)) {
    renderAmpOrMobileAd(dataObject.cacheHost, dataObject.cachePath, dataObject.uuid, true);
  } else if (environment.isAmp(dataObject)) {
    renderAmpOrMobileAd(dataObject.cacheHost, dataObject.cachePath, dataObject.uuid);
  } else if (environment.isCrossDomain()) {
    renderCrossDomain(adId, dataObject.pubUrl);
  } else {
    renderLegacy(doc, adId);
  }
};

/**
 * Calls prebid.js renderAd function to render ad
 * @param {Object} doc Document
 * @param {string} adId Id of creative to render
 */
function renderLegacy(doc, adId) {
  let w = window;
  for (i = 0; i < 10; i++) {
    w = w.parent;
    if (w.pbjs) {
      try {
        w.pbjs.renderAd(document, adId);
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
 * @param {string} pubUrl Url of publisher page
 */
function renderCrossDomain(adId, pubUrl) {
  let urlParser = document.createElement('a');
  urlParser.href = pubUrl;
  let publisherDomain = urlParser.protocol + '//' + urlParser.host;
  let adServerDomain = urlParser.protocol + GOOGLE_IFRAME_HOSTNAME;

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
      let body = window.document.body;
      let ad = adObject.ad;
      let url = adObject.adUrl;
      let width = adObject.width;
      let height = adObject.height;

      if (adObject.mediaType === 'video') {
        console.log('Error trying to write ad.');
      } else if (ad) {
        const iframe = utils.getEmptyIframe(adObject.height, adObject.width);
        body.appendChild(iframe);
        iframe.contentDocument.open();
        iframe.contentDocument.write(ad);
        iframe.contentDocument.close();
      } else if (url) {
        const iframe = utils.getEmptyIframe(height, width);
        iframe.style.display = 'inline';
        iframe.style.overflow = 'hidden';
        iframe.src = url;

        utils.insertElement(iframe, doc, 'body');
      } else {
        console.log(`Error trying to write ad. No ad for bid response id: ${id}`);
      }
    }
  }

  function requestAdFromPrebid() {
    let message = JSON.stringify({
      message: 'Prebid Request',
      adId: adId,
      adServerDomain: adServerDomain
    });
    window.parent.postMessage(message, publisherDomain);
  }

  function listenAdFromPrebid() {
    window.addEventListener('message', renderAd, false);
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
 * @param {Bool} isMobileApp flag to detect mobile app
 */
function renderAmpOrMobileAd(cacheHost, cachePath, uuid, isMobileApp) {
  // For MoPub, creative is stored in localStorage via SDK.
  if(uuid.startsWith('Prebid_')) {
    loadFromLocalCache(uuid)
  } else {
    let adUrl = `${getCacheEndpoint(cacheHost, cachePath)}?uuid=${uuid}`;
    utils.sendRequest(adUrl, responseCallback(isMobileApp));
  }
}

/**
 * Cache request Callback to display creative
 * @param {Bool} isMobileApp 
 */
function responseCallback(isMobileApp) {
  return function(response) {
    let bidObject = parseResponse(response);
    let ad;
    let width = (bidObject.width) ? bidObject.width : bidObject.w;
    let height = (bidObject.height) ? bidObject.height : bidObject.h;
    if (bidObject.adm) {
      ad = (isMobileApp) ? constructMarkup(bidObject.adm, width, height) : bidObject.adm;
      if (bidObject.nurl) {
        ad += utils.createTrackPixelHtml(decodeURIComponent(bidObject.nurl));
      }
      utils.writeAdHtml(ad);
    } else if (bidObject.nurl) {
      if(isMobileApp) {
        let adhtml = utils.loadScript(window, bidObject.nurl);
        ad = constructMarkup(adhtml.outerHTML, width, height);
        utils.writeAdHtml(ad);
      } else {
        let nurl = bidObject.nurl;
        utils.writeAdUrl(nurl, width, height);
      }
    }
  }
};

/**
 * Load response from localStorage. In case of MoPub, sdk caches response
 * @param {string} cacheId 
 */
function loadFromLocalCache(cacheId) {
  let bid = localStorage.getItem(cacheId);
  let displayFn = responseCallback(true);
  displayFn(bid);
}

/**
 * Parse response
 * @param {string} response 
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
 * @param {string} ad 
 * @param {Number} width 
 * @param {Number} height 
 */
function constructMarkup(ad, width, height) {
  var id = utils.getUUID();
  return `<div id="${id}" style="border-style: none; position: absolute; width:100%; height:100%;">
    <div id="${id}_inner" style="margin: 0 auto; width:${width}; height:${height}">${ad}</div>
    </div>`;
}
