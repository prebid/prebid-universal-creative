/**
 * creative.js
 *
 * This file is inserted into the prebid creative as a placeholder for the winning prebid creative. It should support the following formats:
 * - Banner
 * - Outstream Video
 * - Mobile
 * - AMP creatives
 * - All safeFrame creatives
 */

import { newRenderingManager } from './renderingManager';

window.ucTag = (window.ucTag || {});

const renderCreative = newRenderingManager(window);

window.ucTag.renderAd = renderCreative.renderAd;
