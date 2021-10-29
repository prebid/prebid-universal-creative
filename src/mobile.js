/**
 * creative.js
 *
 * This file is inserted into the prebid creative as a placeholder for the winning prebid creative. It should support the following format:
 * - mobile creatives
 */

 import { renderAmpOrMobileAd } from './renderingManager';
 import { transformAuctionTargetingData } from './utils';
 
 window.ucTag = (window.ucTag || {});
 
 window.ucTag.renderAd = (doc, dataObject) => {
    renderAmpOrMobileAd(dataObject, true);
}
 