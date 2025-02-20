import * as domHelper from './domHelper';

/**
 * Inserts an image pixel with the specified `url` for cookie sync
 * @param {string} url URL string of the image pixel to load
 * @param  {function} [done] an optional exit callback, used when this usersync pixel is added during an async process
 */
export function triggerPixel(url, done) {
  const img = new Image();
  if (done && typeof done === 'function') {
    img.addEventListener('load', done);
    img.addEventListener('error', done);
  }
  img.src = url;
}

export function createTrackPixelHtml(url) {
  if (!url) {
    return '';
  }

  let escapedUrl = encodeURI(url);
  let img = `<div style="position:absolute;left:0px;top:0px;visibility:hidden;"><img src="${escapedUrl}"></div>`;
  return img;
}

export function writeAdUrl(adUrl, width, height) {
  let iframe = domHelper.getEmptyIframe(height, width);
  iframe.src = adUrl;
  document.body.appendChild(iframe);
}

export function sendRequest(url, callback) {
  function reqListener() {
    callback(oReq.responseText);
  }

  let oReq = new XMLHttpRequest();
  oReq.addEventListener('load', reqListener);
  oReq.open('GET', url);
  oReq.send();
}

export function getUUID() {
  let d = new Date().getTime();
  let uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    let r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
  return uuid;
};

export function loadScript(currentWindow, tagSrc, successCallback, errorCallback) {
  let doc = currentWindow.document;
  let scriptTag = doc.createElement('script');
  scriptTag.type = 'text/javascript';

  // Execute success callback if necessary
  if (successCallback && typeof successCallback === 'function') {
    if (scriptTag.readyState) {
      scriptTag.onreadystatechange = function() {
        if (scriptTag.readyState === 'loaded' || scriptTag.readyState === 'complete') {
          scriptTag.onreadystatechange = null;
          successCallback();
        }
      };
    } else {
      scriptTag.onload = function() {
        successCallback();
      };
    }
  }

  // Execute error callback if necessary
  if (errorCallback && typeof errorCallback === 'function') {
    scriptTag.onerror = function() {
      errorCallback();
    };
  }

  scriptTag.src = tagSrc;

  //add the new script tag to the page
  let elToAppend = doc.getElementsByTagName('head');
  elToAppend = elToAppend.length ? elToAppend : doc.getElementsByTagName('body');
  if (elToAppend.length) {
    elToAppend = elToAppend[0];
    elToAppend.insertBefore(scriptTag, elToAppend.firstChild);
  }

  return scriptTag;
};

/**
 * Return comment element
 * @param {*} bid
 */
export function getCreativeComment(bid) {
  return document.createComment(`Creative ${bid.crid} served by Prebid.js Header Bidding`);
}

/**
 * Returns comment element markup
 * @param {*} bid
 */
export function getCreativeCommentMarkup(bid) {
  let creativeComment = getCreativeComment(bid);
  let wrapper = document.createElement('div');
  wrapper.appendChild(creativeComment);
  return wrapper.innerHTML;
}

export function transformAuctionTargetingData(tagData) {
  // this map object translates the Prebid.js auction keys to their equivalent Prebid Universal Creative keys
  // when the publisher uses their adserver's generic macro that provides all targeting keys (ie tagData.targetingMap), we need to convert the keys
  const auctionKeyMap = {
    hb_adid: 'adId',
    hb_cache_host: 'cacheHost',
    hb_cache_path: 'cachePath',
    hb_cache_id: 'uuid',
    hb_format: 'mediaType',
    hb_env: 'env',
    hb_size: 'size',
    hb_pb: 'hbPb'
  };

  /**
   * Determine if the supplied property of the tagData object exists and is populated with its own values/properties according to its type
   * @param {string} paramName name of the property to check (eg tagData.targetingMap)
   * @returns true/false
   */
  function isMacroPresent(paramName) {
    return !!(
      tagData[paramName] && (
        (isPlainObject(tagData[paramName]) && Object.keys(tagData[paramName]).length > 0) ||
        (isStr(tagData[paramName]) && tagData[paramName] !== '')
      )
    );
  }

  /**
   * Converts the specifically formatted object of keypairs to a more generalized structure
   * It specifically extracts the keyvalue from an array and stores it as a normal string
   * @param {object} tarMap object of keys with the keyvalue stored in an array; eg {"hb_adid":["26566ee8c7f251"], ...}
   * @returns {object} result is an object map like the following: {"hb_cache_id":"123456", "other_key":"other_value", ...}
   */
  function convertTargetingMapToNormalMap(tarMap) {
    let newTarMap = {};

    Object.keys(tarMap).forEach(function(key) {
      if (Array.isArray(tarMap[key]) && tarMap[key].length > 0) {
        newTarMap[key] = tarMap[key][0];
      }
    });
    return newTarMap;
  }

  /**
   * Converts a specifically formatted string of keypairs to a specifically formatted object map
   * @param {String} keywordsStr string of keypairs; eg "hb_cache_id:123456,other_key:other_value"
   * @returns {object} result is an object map like the following: {"hb_cache_id":"123456", "other_key":"other_value", ...}
   */
  function convertKeyPairStringToMap(keywordsStr) {
    let keywordsMap = {};
    const keywordsArr = keywordsStr.split(',');

    if (keywordsArr.length > 0) {
      keywordsArr.forEach(function(keyPairStr) {
        let keyPairArr = keyPairStr.split(':');
        if (keyPairArr.length === 2) {
          let k = keyPairArr[0];
          let v = keyPairArr[1];
          keywordsMap[k] = v;
        }
      });
    }
    return keywordsMap;
  }

  /**
   * Rename key if it's part of the auctionKeyMap object; if not, leave key as is
   * Store the resultant keypair in the auctionData object for later use in renderingManager.renderAd()
   * @param {object} adServerKeyMap incoming object map of the auction keys from the UC tag; eg {'key1':'value1', 'key2':'value2', ...}
   */
  function renameKnownAuctionKeys(adServerKeyMap) {
    Object.keys(adServerKeyMap).forEach(function(key) {
      let internalKey = auctionKeyMap[key] || key;
      auctionData[internalKey] = adServerKeyMap[key];
    });
  }

  let auctionData = {};
  let formattedKeyMap = {};

  if (isMacroPresent('targetingMap')) {
    formattedKeyMap = convertTargetingMapToNormalMap(tagData.targetingMap);
  } else if (isMacroPresent('targetingKeywords')) {
    formattedKeyMap = convertKeyPairStringToMap(tagData.targetingKeywords);
  }
  renameKnownAuctionKeys(formattedKeyMap);

  // set keys not in defined map macros (eg targetingMap) and/or the keys setup within a non-DFP adserver
  Object.keys(tagData).forEach(function (key) {
    if (key !== 'targetingMap' && key !== 'targetingKeywords' && isStr(tagData[key]) && tagData[key] !== '') {
      auctionData[key] = tagData[key];
    }
  });
  return auctionData;
}

export function parseUrl(url) {
  let parsed = document.createElement('a');

  parsed.href = decodeURIComponent(url);

  return {
    href: parsed.href,
    protocol: (parsed.protocol || '').replace(/:$/, ''),
    hostname: parsed.hostname,
    port: +parsed.port,
    pathname: parsed.pathname.replace(/^(?!\/)/, '/'),
    hash: (parsed.hash || '').replace(/^#/, ''),
    host: (parsed.host || window.location.host).replace(/:(443|80)$/, '')
  };
}

function isA(object, _t) {
  return Object.prototype.toString.call(object) === '[object ' + _t + ']';
};

function isPlainObject(object) {
  return isA(object, 'Object');
}

function isStr(object) {
  return isA(object, 'String');
};
