/*
 * Script to handle firing impression and click trackers from native teamplates
 */
import {newNativeAssetManager} from './nativeAssetManager';
import {prebidMessenger, renderEventMessage} from './messaging.js';

export function newNativeRenderManager(win, mkMessenger = prebidMessenger, assetMgr = newNativeAssetManager) {
    let sendMessage;


    let renderNativeAd = function (doc, nativeTag) {
        window.pbNativeData = nativeTag;
        sendMessage = mkMessenger(nativeTag.pubUrl, win);

        function signalResult(adId, errorInfo) {
            sendMessage(renderEventMessage(adId, errorInfo));
        }

        try {
            const nativeAssetManager = assetMgr(window, nativeTag);

            if (nativeTag.adId != null) {

                if (nativeTag.hasOwnProperty('rendererUrl') && !nativeTag.rendererUrl.match(/##.*##/i)) {
                    const scr = doc.createElement('SCRIPT');
                    scr.src = nativeTag.rendererUrl,
                        scr.id = 'pb-native-renderer';
                    doc.body.appendChild(scr);
                }
                nativeAssetManager.loadAssets(nativeTag.adId, () => {
                    signalResult(nativeTag.adId);
                }, (e) => {
                    signalResult(nativeTag.adId, {reason: 'exception', message: e.message});
                });
            } else {
                signalResult(null, {reason: 'missingDocOrAdid'});
                console.warn('Prebid Native Tag object was missing \'adId\'.');
            }
        } catch (e) {
            signalResult(nativeTag && nativeTag.adId, {reason: 'exception', message: e.message});
            console.error('Error rendering ad', e);
        }
    };

    return {
        renderNativeAd
    };
}
