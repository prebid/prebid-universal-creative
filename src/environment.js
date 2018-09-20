/***************************************
 * Detect Environment Helper Functions
 ***************************************/

/**
 * Functions to detect below environments:
 *  CodeOnPage: div directly on publisher's page
 *  Amp: google Accelerate Mobile Pages ampproject.org
 *  Dfp: google doubleclick for publishers https://www.doubleclickbygoogle.com/
 *  DfpInAmp: AMP page containing a DFP iframe
 *  SafeFrame: SafeFrame
 *  DfpSafeFrame: An iframe that can't get to the top window
 *  Sandboxed: An iframe that can't get to the top window
 *  SuperSandboxed: An iframe without allow-same-origin
 *  Unknown: A default sandboxed implementation delivered by EnvironmentDispatch when all positive environment checks fail
 */

/**
 * @returns true if we are running on the top window at dispatch time
 */
function isTopWindow() {
  return window === window.parent;
}

/**
 * @returns true if the environment is both DFP and AMP
 */
function isDfpInAmp() {
  return isDfp() && isAmp();
}

/**
 * @returns true if the window is in an iframe whose id and parent element id match DFP
 */
function isDfp() {
  try {
    const frameElement = window.frameElement;
    const parentElement = window.frameElement.parentNode;
    if (frameElement && parentElement) {
      return frameElement.id.indexOf('google_ads_iframe') > -1 && parentElement.id.indexOf('google_ads_iframe') > -1;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * @param {String} uuid key value from auction, contains the cache id of the winning bid stored in prebid cache
 * @returns true if there is an AMP context object
 */
export function isAmp(uuid) {
  // TODO Use amp context once it is available in cross domain
  // https://github.com/ampproject/amphtml/issues/6829
  return typeof uuid === 'string' && uuid !== "" && isCrossDomain();
}

/**
 * @returns true if the environment is a SafeFrame.
 */
export function isSafeFrame() {
  return window.$sf && window.$sf.ext;
}

/**
 * @returns true if the environment is a dfp safe frame.
 */
function isDFPSafeFrame() {
  if (window.location && window.location.href) {
    const href = window.location.href;
    return isSafeFrame() && href.indexOf('google') !== -1 && href.indexOf('safeframe') !== -1;
  }
  return false;
}

/**
 * Return true if we are in an iframe and can't access the top window.
 */
export function isCrossDomain() {
  return window.top !== window && !window.frameElement;
}

/**
 * @param {String} env key value from auction, indicates the environment where tag is served
 * @returns true if env exists and is equal to the string 'mobile-app'
 */
export function isMobileApp(env) {
  return env && env === 'mobile-app';
}
