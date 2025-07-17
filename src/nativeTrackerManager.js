/*
 * Script to handle firing impression and click trackers from native teamplates
 */
import { parseUrl, triggerPixel, transformAuctionTargetingData } from './utils';
import { newNativeAssetManager } from './nativeAssetManager';
import {prebidMessenger} from './messaging.js';
import {Freestar} from "./freestar";

const AD_ANCHOR_CLASS_NAME = 'pb-click';
const AD_DATA_ADID_ATTRIBUTE = 'pbAdId';

export function newNativeTrackerManager(win) {
  let sendMessage;

  function findAdElements(className) {
    let adElements = win.document.getElementsByClassName(className);
    return adElements || [];
  }

  function readAdIdFromElement(adElements) {
    let adId = (adElements.length > 0) &&
      adElements[0].attributes &&
      adElements[0].attributes[AD_DATA_ADID_ATTRIBUTE] &&
      adElements[0].attributes[AD_DATA_ADID_ATTRIBUTE].value;
    return adId || '';
  }

  function readAdIdFromSingleElement(adElement) {
    let adId =  adElement.attributes &&
      adElement.attributes[AD_DATA_ADID_ATTRIBUTE] &&
      adElement.attributes[AD_DATA_ADID_ATTRIBUTE].value;
    return adId || '';
  }

  function loadClickTrackers(event, adId) {
    fireTracker(adId, 'click');
  }

  function loadImpTrackers(adElements) {
      for(var i = 0; i < adElements.length; i++){
          let adId = readAdIdFromSingleElement(adElements[i]);
          fireTracker(adId, 'impression');
      }
  }

  function attachClickListeners(adElements, listener = loadClickTrackers) {
    adElements = adElements || findAdElements(AD_ANCHOR_CLASS_NAME);

    for (let i = 0; i < adElements.length; i++) {
      let adId = readAdIdFromSingleElement(adElements[i]);
      adElements[i].addEventListener('pointerdown', function(event) {
        listener(event, adId);
      }, true);
    }
  }

  function fireTracker(adId, action) {
    if (adId === '') {
      console.warn('Prebid tracking event was missing \'adId\'.  Was adId macro set in the HTML attribute ' + AD_DATA_ADID_ATTRIBUTE + 'on the ad\'s anchor element');
    } else {
      let message = { message: 'Prebid Native', adId: adId };

      // fires click trackers when called via link
      if (action === 'click') {
        message.action = 'click';
      }

      sendMessage(message);
    }
  }

  // START OF MAIN CODE
  let startTrackers = function (dataObject) {
    const targetingData = transformAuctionTargetingData(dataObject);
    const freestar = new Freestar(targetingData);
    sendMessage = prebidMessenger(targetingData.pubUrl, win);
    const nativeAssetManager = newNativeAssetManager(window, targetingData.pubUrl);

    if (freestar && freestar.env === 'mobile-app') {
      let cb = function({clickTrackers, impTrackers, eventtrackers} = {}) {
        function loadMobileClickTrackers(clickTrackers) {
          (clickTrackers || []).forEach(triggerPixel);
        }
        const boundedLoadMobileClickTrackers = loadMobileClickTrackers.bind(null, clickTrackers);
        attachClickListeners(false, boundedLoadMobileClickTrackers);

        (impTrackers || []).forEach(triggerPixel);

        // fire impression IMG trackers
        eventtrackers
          .filter(tracker => tracker.event === 1 && tracker.method === 1)
          .map(tracker => tracker.url)
          .forEach(triggerPixel);

        // fire impression JS trackers
        eventtrackers
          .filter(tracker => tracker.event === 1 && tracker.method === 2)
          .map(tracker => tracker.url)
          .forEach(trackerUrl => loadScript(document, trackerUrl));
      }
      nativeAssetManager.loadMobileAssets(freestar, cb);
    } else {
      let adElements = findAdElements(AD_ANCHOR_CLASS_NAME);

      nativeAssetManager.loadAssets(
        readAdIdFromElement(adElements),
        attachClickListeners
      );

      attachClickListeners(adElements, loadClickTrackers);

      // fires native impressions on creative load
      if (adElements.length > 0) {
        loadImpTrackers(adElements);
      }
    }
  }

  return {
    startTrackers
  }
}
