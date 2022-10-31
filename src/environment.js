/***************************************
 * Detect Environment Helper Functions
 ***************************************/

/**
 * Functions to detect below environments:
 *  Amp: google Accelerate Mobile Pages ampproject.org
 *  SafeFrame: SafeFrame
 *  CrossDomain: An iframe that can't get to the top window
 *  Mobile App: function to detect mobile app environment
 */

/**
 * @param {String} uuid key value from auction, contains the cache id of the winning bid stored in prebid cache
 * @returns true if there is an AMP context object
 */
export function isAmp(uuid, win) {
  // TODO Use amp context once it is available in cross domain
  // https://github.com/ampproject/amphtml/issues/6829
  return typeof uuid === 'string' && uuid !== "" && isCrossDomain(win);
}

/**
 * @returns true if the environment is a SafeFrame.
 */
export function isSafeFrame(win) {
  return !!(win.$sf && win.$sf.ext);
}

/**
  * Return true if we are in an iframe and can't access the top window.
  * @returns true if the environment is a Cross Domain
  */
export function isCrossDomain(win) {
  return win.top !== win && !canInspectWindow(win);
}

/**
 * Returns true if win's properties can be accessed and win is defined.
 * This functioned is used to determine if a window is cross-domained
 * from the perspective of the current window.
 * @param {!Window} win
 * @return {boolean}
 */
export function canInspectWindow(win) {
  try {
    // force an exception in x-domain environments. #1509
    win.top.location.toString();
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Returns true if we can find the prebid global object (eg pbjs) as we
 * climb the accessible windows.  Return false if it's not found.
 * @returns {boolean}
 */
export function canLocatePrebid(win) {
  let result = false;
  let currentWindow = win;

  while (!result) {
    try {
      if (currentWindow.$$PREBID_GLOBAL$$) {
        result = true;
        break;
      }
    } catch (e) { }
    if (currentWindow === window.top) break;

    currentWindow = currentWindow.parent;
  }
  return result;
}

/**
 * @param {String} env key value from auction, indicates the environment where tag is served
 * @returns true if env exists and is equal to the string 'mobile-app'
 */
export function isMobileApp(env) {
  return env && env === 'mobile-app';
}
