/*
 * Script to handle firing impression and click trackers from native teamplates
 */
import { newNativeAssetManager } from './nativeAssetManager';
import {prebidMessenger} from './messaging.js';

const AD_ANCHOR_CLASS_NAME = 'pb-click';
const AD_DATA_ADID_ATTRIBUTE = 'pbAdId';

export function newNativeRenderManager(win) {
  let sendMessage;


  function findAdElements(className) {
    let adElements = win.document.getElementsByClassName(className);
    return adElements || [];
  }

  function loadClickTrackers(event, adId) {
    fireTracker(adId, 'click');
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

  function fireNativeImpTracker(adId) {
    fireTracker(adId, 'impression');
  }

  function fireNativeCallback() {
    const adElements = findAdElements(AD_ANCHOR_CLASS_NAME);
    for (let i = 0; i < adElements.length; i++) {
      adElements[i].addEventListener('click', function(event) {
        loadClickTrackers(event, window.pbNativeData.adId);
      }, true);
    }
  }

  // START OF MAIN CODE
  let renderNativeAd = function(doc, nativeTag) {
    window.pbNativeData = nativeTag;
    sendMessage = prebidMessenger(nativeTag.pubUrl, win);
    const nativeAssetManager = newNativeAssetManager(window, nativeTag.pubUrl);

    if (nativeTag.hasOwnProperty('adId')) {

      if (nativeTag.hasOwnProperty('rendererUrl') && !nativeTag.rendererUrl.match(/##.*##/i)) {
        const scr = doc.createElement('SCRIPT');
        scr.src = nativeTag.rendererUrl,
        scr.id = 'pb-native-renderer';
        doc.body.appendChild(scr);
      }
      nativeAssetManager.loadAssets(nativeTag.adId, () => {
        fireNativeImpTracker(nativeTag.adId);
        fireNativeCallback();
      });
    } else {
      console.warn("Prebid Native Tag object was missing 'adId'.");
    }
  }

  return {
    renderNativeAd
  }
}
