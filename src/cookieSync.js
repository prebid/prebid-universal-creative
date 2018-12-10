/**
 * This script runs the Prebid Server cookie syncs.
 * For more details, see https://github.com/prebid/prebid-server/blob/master/docs/developers/cookie-syncs.md
 *
 * This script uses the following query params in the URL:
 *
 *   max_sync_count (optional): The number of syncs allowed on the page. If present, this should be a positive integer.
 */

const ENDPOINT = 'https://prebid.adnxs.com/pbs/v1/cookie_sync';
const MAX_SYNC_COUNT = sanitizeSyncCount(parseInt(parseQueryParam('max_sync_count', window.location.search), 10));

function doBidderSync(type, url, bidder) {
  if (!url) {
    console.log(`No sync url for bidder "${bidder}": ${url}`);
  } else if (type === 'image' || type === 'redirect') {
    console.log(`Invoking image pixel user sync for bidder: "${bidder}"`);
    triggerPixel(url);
  } else if (type == 'iframe') {
    // TODO test iframe solution
  } else {
    console.log(`User sync type "${type}" not supported for bidder: "${bidder}"`);
  }
}

function triggerPixel(url) {
  const img = new Image();
  img.src = url;
}

function process(response) {
  let result = JSON.parse(response);
  if (result.status === 'OK' || result.status === 'no_cookie') {
    let bidders = result.bidder_status;
    if (bidders) {
      bidders.forEach(bidder => {
        if (bidder.no_cookie) {
          doBidderSync(bidder.usersync.type, bidder.usersync.url, bidder.bidder);
        }
      });
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
 * If the value is a valid sync count (0 or a positive number), return it.
 * Otherwise return a really big integer (equivalent to "no sync").
 */
function sanitizeSyncCount(value) {
  if (isNaN(value) || value < 0) {
    return 9007199254740991 // Number.MAX_SAFE_INTEGER isn't supported in IE
  }
  return value;
}

// Request MAX_SYNC_COUNT cookie syncs from prebid server.
// In next phase we will read placement id's from query param and will only get cookie sync status of bidders participating in auction
var data = JSON.stringify({
  limit: MAX_SYNC_COUNT
});
ajax(ENDPOINT, process, data);
