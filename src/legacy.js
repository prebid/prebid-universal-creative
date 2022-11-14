/**
* legacy.js
* This is deprecated code, publishers should not use one .js creative to handle all different types of creative.
* To reduce bytes transfered for each ad, publishers should use specific .js based on hb_format targeting key-value.
*
* This file is inserted into the prebid creative as a placeholder for the winning prebid creative. It should support the following formats:
* - Banner
* - AMP
* - Mobile
* - Outstream Video
* - All safeFrame creatives
*/

import { transformAuctionTargetingData } from './utils';
import { renderBannerOrDisplayAd } from './renderingManager';
import { renderAmpOrMobileAd } from './mobileAndAmpRender';
import { isMobileApp, isAmp } from './environment';

window.ucTag = (window.ucTag || {});

window.ucTag.renderAd = (doc, dataObject) => {
  const targetingData = transformAuctionTargetingData(dataObject);

  if (isMobileApp(targetingData.env) || isAmp(targetingData.uuid, window)) {
    renderAmpOrMobileAd(dataObject);
  } else {
    renderBannerOrDisplayAd(doc, dataObject);
  }
}
