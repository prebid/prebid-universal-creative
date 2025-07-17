/**
 * This script runs the Prebid Server cookie syncs.
 * For more details, see https://github.com/prebid/prebid-server/blob/master/docs/developers/cookie-syncs.md
 *
 * This script uses the following query params in the URL:
 *
 *   max_sync_count (optional): The number of syncs allowed on the page. If present, this should be a positive integer.
 *
 *   endpoint (optional): The endpoint to handle bidder sync. If present, this should be a defined property in VALID_ENDPOINTS.
 */
import * as domHelper from './domHelper';

const VALID_ENDPOINTS = {
  rubicon: 'https://prebid-server.rubiconproject.com/cookie_sync',
  appnexus: 'https://prebid.adnxs.com/pbs/v1/cookie_sync',
  freestar: 'https://prebid-web.pub.network/cookie_sync'
};
const ENDPOINT = sanitizeEndpoint(parseQueryParam('endpoint', window.location.search));
const ENDPOINT_ARGS = sanitizeEndpointArgs(parseQueryParam('args', window.location.search));
const BIDDER_ARGS = sanitizeBidders(parseQueryParam('bidders', window.location.search));
const IS_AMP = sanitizeSource(parseQueryParam('source', window.location.search));
const maxSyncCountParam = parseQueryParam('max_sync_count', window.location.search);
const MAX_SYNC_COUNT = sanitizeSyncCount(parseInt((maxSyncCountParam) ? maxSyncCountParam : 10, 10));
const coopSyncParam = parseQueryParam('coop_sync', window.location.search);
const COOP_SYNC = !coopSyncParam || coopSyncParam === 'true' || !!parseInt(coopSyncParam);
const GDPR = sanitizeGdpr(parseInt(parseQueryParam('gdpr', window.location.search), 10));
const GDPR_CONSENT = sanitizeGdprConsent(parseQueryParam('gdpr_consent', window.location.search));

/**
 * checks to make sure URL is valid. Regex from https://validatejs.org/#validators-url, https://gist.github.com/dperini/729294
 */
function isValidUrl(url) {
  let regex = new RegExp(/^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z0-9\u00a1-\uffff][a-z0-9\u00a1-\uffff_-]{0,62})?[a-z0-9\u00a1-\uffff]\.)+(?:[a-z\u00a1-\uffff]{2,}\.?))(?::\d{2,5})?(?:[/?#]\S*)?$/i);
  return regex.test(url);
}

function doBidderSync(type, url, bidder, done) {
  if (!url || !isValidUrl(url)) {
    console.log(`No valid sync url for bidder "${bidder}": ${url}`);
    done();
  } else if (type === 'image' || type === 'redirect') {
    console.log(`Invoking image pixel user sync for bidder: "${bidder}"`);
    triggerPixel(url, done);
  } else if (type == 'iframe') {
    console.log(`Invoking iframe pixel user sync for bidder: "${bidder}"`);
    triggerIframeLoad(url, bidder, done);
  } else {
    console.log(`User sync type "${type}" not supported for bidder: "${bidder}"`);
    done();
  }
}

function triggerIframeLoad(url, bidder, done) {
  if(!url){
   return;
  }
  let iframe = domHelper.getEmptyIframe(0, 0);
  iframe.id = `sync_${bidder}_${Date.now()}`;
  iframe.src = url;
  iframe.onload = done;
  // we aren't listening to onerror because it won't fire for x-domain sources
  // however, in the event that the URL can't be resolved, the browser still invokes onload
  domHelper.insertElement(iframe, document, 'html');
}

function triggerPixel(url, done) {
  const img = new Image();
  img.addEventListener('load', done);
  img.addEventListener('error', done);
  img.src = url;
}

function doAllSyncs(bidders) {
  if (bidders.length === 0) {
    return;
  }

  const thisSync = bidders.pop();
  if (thisSync.no_cookie) {
    doBidderSync(thisSync.usersync.type, thisSync.usersync.url, thisSync.bidder, doAllSyncs.bind(null, bidders));
  } else {
    doAllSyncs(bidders);
  }
}

function process(response) {
  let result = JSON.parse(response);
  if (result.status === 'ok' || result.status === 'no_cookie') {
    if (result.bidder_status) {
      doAllSyncs(result.bidder_status);
    }
  }
}

function ajax(url, callback, data, options = {}) {
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

/**
 * Parse a query param value from the window.location.search string.
 * Implementation comes from: https://davidwalsh.name/query-string-javascript
 *
 * @param {string} name The name of the query param you want the value for.
 * @param {string} urlSearch The search string in the URL: window.location.search
 * @return {string} The value of the "name" query param.
 */
function parseQueryParam(name, urlSearch) {
  var regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
  var results = regex.exec(urlSearch);
  return results === null ? '' : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

/**
 * If the value is a valid url (string and is defined in VALID_ENDPOINTS), return it.
 * Otherwise it will return a default value
 */
function sanitizeEndpoint(value) {
  let defaultUrl = 'https://prebid.adnxs.com/pbs/v1/cookie_sync';
  if (!value) return defaultUrl;

  let url = VALID_ENDPOINTS[value] || decodeURIComponent(value) || '';
  return (isValidUrl(url)) ? url : defaultUrl;
}

function sanitizeEndpointArgs(value) {
  if (value) {
    var argProperties = value.split(',').reduce(function(keyValues, key) {
      var keyValue = key.split(':');
      if (keyValue.length === 2 && keyValue[0] !== '' && keyValue[1] !== '') {
        keyValues[keyValue[0]] = /^\d+$/.test(keyValue[1]) ? parseInt(keyValue[1]) : keyValue[1];
      }
      return keyValues;
    }, {});
    return (argProperties && Object.keys(argProperties).length) ? argProperties : undefined;
  } 
}

/**
 * Function to return if source set to amp
 * @param {string} query param defining name of source
 * @return {Boolean} returns if source is equal to amp
 */
function sanitizeSource(value) {
  return (value && value.toLowerCase() === 'amp');
}

/**
 * If the value is a valid sync count (0 or a positive number), return it.
 * Otherwise return a really big integer (equivalent to "no sync").
 */
function sanitizeSyncCount(value) {
  if (isNaN(value) || value < 0) {
    return 9007199254740991 // Number.MAX_SAFE_INTEGER isn't supported in IE
  }
  return value;
}

/**
 * If the value is 0 or 1 return it.
 * Otherwise it will return undefined.
 */
function sanitizeGdpr(value) {
  if (value === 0 || value === 1) {
    return value;
  }
  console.log('Ignoring gdpr param, it should be 1 or 0')
}

/**
 * If the value is a non empty string return it.
 * Otherwise it will return undefined.
 */
function sanitizeGdprConsent(value) {
  if (value) {
    return value;
  }
  console.log('Ignoring gdpr_consent param, it should be a non empty value')
}

/**
 * If the value is a non empty string return it.
 * Otherwise it will return undefined.
 */
function sanitizeBidders(value) {
  if (value) {
    var arr = value.split(',');
    var filtered = arr.filter(function (el) {
      return (el) ? true : false;
    });
    if(filtered.length > 0){
      return filtered;
    }
  }
}

// Request MAX_SYNC_COUNT cookie syncs from prebid server.
// In next phase we will read placement id's from query param and will only get cookie sync status of bidders participating in auction

function getStringifiedData(endPointArgs) {
  var data = (endPointArgs && typeof endPointArgs === 'object') ? endPointArgs : {}
  data['limit'] = MAX_SYNC_COUNT;
  data['coopSync'] = COOP_SYNC;

  if(GDPR) data.gdpr = GDPR;
  if(GDPR_CONSENT) data.gdpr_consent = GDPR_CONSENT;
  if(IS_AMP) data.filterSettings = {
    iframe: {
      bidders: '*',
      filter: 'exclude'
    }
  };
  if(BIDDER_ARGS) data.bidders = BIDDER_ARGS;

  return JSON.stringify(data);
}


ajax(ENDPOINT, process, getStringifiedData(ENDPOINT_ARGS), {
  withCredentials: true
});
