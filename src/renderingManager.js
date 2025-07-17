import { parseUrl, transformAuctionTargetingData } from './utils';
import { canLocatePrebid } from './environment';
import { insertElement, getEmptyIframe } from './domHelper';
import {prebidMessenger, renderEventMessage} from './messaging.js';
import {hasDynamicRenderer, runDynamicRenderer} from './dynamicRenderer.js';
import {Freestar} from "./freestar";

export function renderBannerOrDisplayAd(doc, dataObject) {
  const targetingData = transformAuctionTargetingData(dataObject);
  const freestar = new Freestar(targetingData);
  if (!canLocatePrebid(window)) {
    renderCrossDomain(window, freestar.adId, targetingData.adServerDomain, targetingData.pubUrl);
  } else {
    renderLegacy(doc, freestar.adId);
  }
}

/**
 * Calls prebid.js renderAd function to render ad
 * @param {Object} doc Document
 * @param {string} adId Id of creative to render
 */
export function renderLegacy(doc, adId) {
  let found = false;
  let w = window;
  for (let i = 0; i < 10; i++) {
    w = w.parent;
    if (w.$$PREBID_GLOBAL$$) {
      try {
        w.$$PREBID_GLOBAL$$.renderAd(doc, adId);
        found = true;
        break;
      } catch (e) {
        continue;
      }
    }
  }
  if (!found) {
    console.error("Unable to locate $$PREBID_GLOBAL$$.renderAd function!");
  }
}

/**
 * Render ad in safeframe using postmessage
 * @param {string} adId Id of creative to render
 * @param {string} pubAdServerDomain publisher adserver domain name
 * @param {string} pubUrl Url of publisher page
 */
export function renderCrossDomain(win, adId, pubAdServerDomain = '', pubUrl) {
  let windowLocation = win.location;
  let adServerDomain = pubAdServerDomain || win.location.hostname;
  let fullAdServerDomain = windowLocation.protocol + '//' + adServerDomain;
  const sendMessage = prebidMessenger(pubUrl, win);
  const signalRenderResult = (errorInfo) => sendMessage(renderEventMessage(adId, errorInfo));

  function renderAd(ev) {
    let key = ev.message ? "message" : "data";
    let adObject = {};
    try {
      adObject = JSON.parse(ev[key]);
    } catch (e) {
      return;
    }

    if (
      adObject.message &&
      adObject.message === "Prebid Response" &&
      adObject.adId === adId
    ) {
      if (hasDynamicRenderer(adObject)) {
        runDynamicRenderer(adId, adObject, sendMessage, win);
        return;
      }
      try {
        let body = win.document.body;
        let ad = adObject.ad;
        let url = adObject.adUrl;
        let width = adObject.width;
        let height = adObject.height;

        if (adObject.mediaType === "video") {
          signalRenderResult({
            reason: "preventWritingOnMainDocument",
            message: `Cannot render video ad ${adId}`,
          });
          console.log("Error trying to write ad.");
        } else if (ad) {
          const iframe = getEmptyIframe(adObject.height, adObject.width);
          body.appendChild(iframe);
          iframe.contentDocument.open();
          iframe.contentDocument.write(ad);
          iframe.contentDocument.close();
          signalRenderResult();
        } else if (url) {
          const iframe = getEmptyIframe(height, width);
          iframe.style.display = "inline";
          iframe.style.overflow = "hidden";
          iframe.src = url;

          insertElement(iframe, document, "body");
          signalRenderResult();
        } else {
          signalRenderResult({
            reason: "noAd",
            message: `No ad for ${adId}`,
          });
          console.log(
            `Error trying to write ad. No ad markup or adUrl for ${adId}`
          );
        }
      } catch (e) {
        signalRenderResult({ reason: "exception", message: e.message });
        console.log(`Error in rendering ad`, e);
      }
    }
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
