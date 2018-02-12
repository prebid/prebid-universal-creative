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

/**
 * DataObject passed to render the ad
 * @typedef {Object} dataObject
 * @property {string} host - Prebid cache host
 * @property {string} uuid - ID to fetch the value from prebid cache
 * @property {string} mediaType - Creative media type, It can be banner, native or video
 * @property {string} pubUrl - Publisher url
 */

/**
 * @param  {object} doc
 * @param  {string} adId
 * @param  {dataObject} dataObject
 */
pbjs.renderAd = function(doc, adId, dataObject) {
  if (environment.isAmp(dataObject)) {
    renderAmpAd(dataObject.host, dataObject.uuid);
  } else if (environment.isCrossDomain()) {
    renderCrossDomain(adId, dataObject.pubUrl);
  } else {
    renderLegacy(doc, adId);
  }
};

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
        body.appendChild(frame);
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

function renderAmpAd(cacheHost, uuid) {
  if (cacheHost === '') {
    cacheHost = 'prebid.adnxs.com';
  }
  // TODO pass in /path from creative since it might change
  let adUrl = 'https://' + cacheHost + '/pbc/v1/cache?uuid=' + uuid;

  let handler = function(response) {
    let bidObject;
    try {
      bidObject = JSON.parse(response);
    } catch (error) {
      console.log(`Error parsing response from cache host: ${error}`);
    }
    // Add seatbid
    let ad;
    if (bidObject.adm && bidObject.nurl) {
      ad = bidObject.adm;
      ad += utils.createTrackPixelHtml(decodeURIComponent(bidObject.nurl));
      utils.writeAdHtml(ad);
    } else if (bidObject.adm) {
      ad = bidObject.adm;
      utils.writeAdHtml(ad);
    } else if (bidObject.nurl) {
      let nurl = bidObject.nurl;
      utils.writeAdUrl(nurl, bidObject.h, bidObject.w);
    }
  };
  utils.sendRequest(adUrl, handler);
}
