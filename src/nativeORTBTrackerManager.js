import { loadScript, triggerPixel } from "./utils";

export function fireNativeImpressionTrackers(ortb) {
    const eventTrackers = ortb.eventtrackers || [];
    const impressionTrackers = eventTrackers.filter(tracker => tracker.event === 1);

    let imgEventTrackers = impressionTrackers.filter(ev => ev.method == 1).map(e => e.url);
    let jsEventTrackers = impressionTrackers.filter(ev => ev.method == 2).map(e => e.url);

    imgEventTrackers.forEach(url => triggerPixel(url));
    jsEventTrackers.forEach(url => loadScript(window, url));
}

export function fireNativeClickTrackers(ortb) {
    const adElements = document.getElementsByClassName('pb-click') || [];
    const assetIdLinkMap = ortb.assets.filter(a => a.link).reduce((map, asset) => (map[asset.id] = asset.link, map), {});
    const masterClickTrackers = ortb.link.clicktrackers || [];
    for (let i = 0; i < adElements.length; i++) {
        adElements[i].addEventListener('click', function (event) {
            let targetElement = event.target;
            let assetId = targetElement && targetElement.getAttribute('hb_native_asset_id');
            let assetLink = assetIdLinkMap[assetId] || {};
            let clickTrackers = assetLink.clicktrackers;
            if (!clickTrackers || !Array.isArray(clickTrackers) || !clickTrackers.length) {
                clickTrackers = masterClickTrackers;
            }
            clickTrackers.forEach(url => triggerPixel(url));
        }, true);
    }
}
