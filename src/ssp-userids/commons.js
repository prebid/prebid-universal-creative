/**
 * Store data in local storage
 * @param {string} key 
 * @param {string} value 
 */

export function setDataInLocalStorage(key, value) {
  if (hasLocalStorage()) {
    window.localStorage.setItem(key, value);
  }
}

/**
 * Get data from local storage
 * @param {string} key 
 */
export function getDataFromLocalStorage(key) {
  if (hasLocalStorage()) {
    return window.localStorage.getItem(key);
  }
}

/**
 * Check local storage is supported or not
 */
export function hasLocalStorage() {
  try {
    return !!window.localStorage;
  } catch (e) {
    console.log('Local storage api disabled');
  }
}

export function timestamp() {
  return new Date().getTime();
}

export function ajax(url, callback, data, options = {}) {
  try {
    let timeout = 3000;
    let x;
    let method = options.method || (data ? 'POST' : 'GET');

    let callbacks = typeof callback === 'object' ? callback : {
      success: function() {
        console.log('xhr success');
      },
      error: function(e) {
        console.log('xhr error', null, e);
      }
    };

    if (typeof callback === 'function') {
      callbacks.success = callback;
    }

    x = new window.XMLHttpRequest();
    x.onreadystatechange = function () {
      if (x.readyState === 4) {
        let status = x.status;
        if ((status >= 200 && status < 300) || status === 304) {
          callbacks.success(x.responseText, x);
        } else {
          callbacks.error(x.statusText, x);
        }
      }
    };
    x.ontimeout = function () {
      console.log('xhr timeout after ', x.timeout, 'ms');
    };

    if (method === 'GET' && data) {
      let urlInfo = parseURL(url, options);
      Object.assign(urlInfo.search, data);
      url = formatURL(urlInfo);
    }

    x.open(method, url);
    // IE needs timoeut to be set after open - see #1410
    x.timeout = timeout;

    if (options.withCredentials) {
      x.withCredentials = true;
    }
    if (options.preflight) {
      x.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }
    x.setRequestHeader('Content-Type', options.contentType || 'text/plain');

    if (method === 'POST' && data) {
      x.send(data);
    } else {
      x.send();
    }
  } catch (error) {
    console.log('xhr construction', error);
  }
}