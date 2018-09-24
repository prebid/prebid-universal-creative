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


