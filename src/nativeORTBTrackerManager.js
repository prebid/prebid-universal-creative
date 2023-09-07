import { loadScript, triggerPixel } from "./utils";

const AD_ANCHOR_CLASS_NAME = 'pb-click';
const ASSET_ID_ELEMENT_ATTRIBUTE = 'hb_native_asset_id';

export function fireNativeImpressionTrackers(adId, sendMessage) {
    const message = {
        message: 'Prebid Native',
        action: 'fireNativeImpressionTrackers',
        adId
      };
    sendMessage(message);
}

export function addNativeClickTrackers(adId, sendMessage) {
    const message = {
        message: 'Prebid Native',
        action: 'click',
        adId
      };
    const adElements = document.getElementsByClassName(AD_ANCHOR_CLASS_NAME) || [];
    // get all assets that have 'link' property, map asset.id -> asset.link
    for (let i = 0; i < adElements.length; i++) {
        adElements[i].addEventListener('click', (event) => {
            let targetElement = event.target;
            // check if clicked element is associated with any native asset (look for 'hb_native_asset_id' attribute)
            let assetId = targetElement && targetElement.getAttribute(ASSET_ID_ELEMENT_ATTRIBUTE);
            message.assetId = assetId;
            sendMessage(message);
        }, true);
    }
}
