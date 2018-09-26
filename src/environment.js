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


export function newEnvironment(win) {
  /**
   * @param {String} uuid key value from auction, contains the cache id of the winning bid stored in prebid cache
   * @returns true if there is an AMP context object
   */
  function isAmp(uuid) {
    // TODO Use amp context once it is available in cross domain
    // https://github.com/ampproject/amphtml/issues/6829
    return typeof uuid === 'string' && uuid !== "" && isCrossDomain();
  }

  /**
   * @returns true if the environment is a SafeFrame.
   */
  function isSafeFrame() {
    return !!(win.$sf && win.$sf.ext);
  }

  /**
   * Return true if we are in an iframe and can't access the top window.
   */
  function isCrossDomain() {
    return win.top !== win && !win.frameElement;
  }

  /**
   * @param {String} env key value from auction, indicates the environment where tag is served
   * @returns true if env exists and is equal to the string 'mobile-app'
   */
  function isMobileApp(env) {
    return env && env === 'mobile-app';
  }

  return {
    isMobileApp,
    isCrossDomain,
    isSafeFrame,
    isAmp
  }
}


