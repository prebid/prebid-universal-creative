import { newNativeTrackerManager } from './nativeTrackerManager';

window.pbNativeTag = (window.pbNativeTag || {});
const nativeTrackerManager = newNativeTrackerManager(window);

window.pbNativeTag.startTrackers = nativeTrackerManager.startTrackers;

