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

/**
 * @param  {object} doc
 * @param  {string} adId
 * @param  {object} dataObject
 */
pbjs.renderAd = function(doc, adId, dataObject) {
  if (environment.isAmp(dataObject)) {
    renderAmpAd(dataObject.host, dataObject.uuid);
  } else if (environment.isCrossDomain()) {
    renderCrossDomain(adId, dataObject.pubUrl);
  } else {
    // assume legacy?
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
  let adServerDomain = urlParser.protocol + '//tpc.googlesyndication.com';

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
        let frame = utils.getEmptyIframe();
        body.appendChild(frame);
        frame.contentDocument.open();
        frame.contentDocument.write(ad);
        frame.contentDocument.close();
      } else if (url) {
        body.insertAdjacentHTML('beforeend', '<IFRAME SRC="' + url + '" FRAMEBORDER="0" SCROLLING="no" MARGINHEIGHT="0" MARGINWIDTH="0" TOPMARGIN="0" LEFTMARGIN="0" ALLOWTRANSPARENCY="true" WIDTH="' + width + '" HEIGHT="' + height + '"></IFRAME>');
      } else {
        console.log('Error trying to write ad. No ad for bid response id: ' + id);
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
      // Invalid json
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
      // TODO test height and width. ortb spec represents width and height as w and h.
      utils.writeAdUrl(nurl, bidObject.h, bidObject.w);
    }
  };
  utils.sendRequest(adUrl, handler);
}

// function render() {
//   let { height, width, ad, mediaType, adUrl, renderer } = bid;

//   if (renderer && renderer.url) {
//     renderer.render(bid);
//   } else if ((doc === document && !utils.inIframe()) || mediaType === 'video') {
//     utils.logError(`Error trying to write ad. Ad render call ad id ${id} was prevented from writing to the main document.`);
//   } else if (ad) {
//     doc.write(ad);
//     doc.close();
//     setRenderSize(doc, width, height);
//   } else if (adUrl) {
//     let iframe = utils.createInvisibleIframe();
//     iframe.height = height;
//     iframe.width = width;
//     iframe.style.display = 'inline';
//     iframe.style.overflow = 'hidden';
//     iframe.src = adUrl;

//     utils.insertElement(iframe, doc, 'body');
//     setRenderSize(doc, width, height);
//   }
// }