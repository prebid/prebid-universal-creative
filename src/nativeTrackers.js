import { newNativeAssetManager } from './nativeAssetManager';
import { newNativeTrackerManager } from './nativeTrackerManager';

window.pbNativeTag = (window.pbNativeTag || {});

const nativeTrackerManager = newNativeTrackerManager(window);
window.pbNativeTag.startTrackers = nativeTrackerManager.startTrackers;

const nativeAssetManager = newNativeAssetManager(window);
window.pbNativeTag.loadAssets = nativeAssetManager.scanForPlaceholders;
