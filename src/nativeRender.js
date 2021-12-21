import { newNativeRenderManager } from './nativeRenderManager';

const nativeRenderManager = newNativeRenderManager(window);

window.ucTag = (window.ucTag || {});

window.ucTag.renderAd = nativeRenderManager.renderNativeAd;
