/**
 * creative.js
 *
 * This file is inserted into the prebid creative as a placeholder for the winning prebid creative. It should support the following format:
 * - AMP creatives
 */

import { renderAmpOrMobileAd } from './mobileAndAmpRender';

window.ucTag = (window.ucTag || {});

window.ucTag.renderAd = (doc, dataObject) => {
  renderAmpOrMobileAd(dataObject);
}
