import { newNativeRenderManager } from './nativeRenderManager';

window.pbNativeTag = (window.pbNativeTag || {});
const nativeRenderManager = newNativeRenderManager(window);

window.pbNativeTag.renderNativeAd = nativeRenderManager.renderNativeAd;
