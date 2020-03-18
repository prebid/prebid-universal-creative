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
function parseQS(query) {
  return !query ? {} : query
    .replace(/^\?/, '')
    .split('&')
    .reduce((acc, criteria) => {
      let [k, v] = criteria.split('=');
      if (/\[\]$/.test(k)) {
        k = k.replace('[]', '');
        acc[k] = acc[k] || [];
        acc[k].push(v);
      } else {
        acc[k] = v || '';
      }
      return acc;
    }, {});
}
const DEFAULT_DEBUG = (parseQS(window.location.search)['puc_debug'] || '').toUpperCase() === 'TRUE';
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
    * @returns true if the environment is a Cross Domain
    */
  function isCrossDomain() {
		return win.top !== win && !canInspectWindow(win);
	}
		
	/**
	 * Returns true if win's properties can be accessed and win is defined.
	 * This functioned is used to determine if a window is cross-domained
	 * from the perspective of the current window.
	 * @param {!Window} win
	 * @return {boolean}
	 */
	function canInspectWindow(win) {
		try {
			// force an exception in x-domain environments. #1509
			win.top.location.toString();
			let currentWindow;
			do {
				currentWindow = currentWindow ? currentWindow.parent : win;
			}
			while (currentWindow !== win.top);
			return true;
		} catch (e) {
			return false;
		}
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

export function getConfig(val) {
  return DEFAULT_DEBUG;
}
