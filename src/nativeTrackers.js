import { newNativeTrackerManager } from './nativeTrackerManager';
import { newNativeRenderManager } from './nativeRenderManager';

window.pbNativeTag = (window.pbNativeTag || {});
const nativeTrackerManager = newNativeTrackerManager(window);
const nativeRenderManager = newNativeRenderManager(window);

window.pbNativeTag.startTrackers = nativeTrackerManager.startTrackers;
window.pbNativeTag.renderNativeAd = nativeRenderManager.renderNativeAd;

