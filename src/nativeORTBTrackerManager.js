import { loadScript, triggerPixel } from "./utils";

const AD_ANCHOR_CLASS_NAME = 'pb-click';
const ASSET_ID_ELEMENT_ATTRIBUTE = 'hb_native_asset_id';

export function fireNativeImpressionTrackers(ortb) {
    const eventTrackers = ortb.eventtrackers || [];
    // get only impression event trackers (tracker.event === 1)
    const impressionTrackers = eventTrackers.filter(tracker => tracker.event === 1);

    // get urls of img impression trackers
    let imgEventTrackers = impressionTrackers.filter(ev => ev.method == 1).map(e => e.url);
    // get urls of js impression trackers
    let jsEventTrackers = impressionTrackers.filter(ev => ev.method == 2).map(e => e.url);

    imgEventTrackers.forEach(url => triggerPixel(url));
    jsEventTrackers.forEach(url => loadScript(window, url));
}

export function fireNativeClickTrackers(ortb) {
    const adElements = document.getElementsByClassName(AD_ANCHOR_CLASS_NAME) || [];
    // get all assets that have 'link' property, map asset.id -> asset.link
    const assetIdLinkMap = ortb.assets.filter(a => a.link).reduce((map, asset) => (map[asset.id] = asset.link, map), {});
    const masterClickTrackers = ortb.link.clicktrackers || [];
    for (let i = 0; i < adElements.length; i++) {
        adElements[i].addEventListener('click', (event) => {
            let targetElement = event.target;
            // check if clicked element is associated with any native asset (look for 'hb_native_asset_id' attribute)
            let assetId = targetElement && targetElement.getAttribute(ASSET_ID_ELEMENT_ATTRIBUTE);
            let assetLink = assetIdLinkMap[assetId];
            let clickTrackers = masterClickTrackers;
            // if asset has link object, use clicktrackers from the asset
            if (assetLink) {
                clickTrackers = assetLink.clicktrackers || [];
            }
            clickTrackers.forEach(url => triggerPixel(url));
        }, true);
    }
}
