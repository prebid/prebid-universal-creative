import { newNativeRenderManager } from './nativeRenderManager';

window.pbNativeTag = (window.pbNativeTag || {});
window.nativeRenderManager = newNativeRenderManager(window);

window.pbNativeTag.renderNativeAd = (args) => nativeRenderManager.renderNativeAd.call(null, document, args);
