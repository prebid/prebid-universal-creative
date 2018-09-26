const postscribe = require('postscribe');

export function createTrackPixelHtml(url) {
  if (!url) {
    return '';
  }

  let escapedUrl = encodeURI(url);
  let img = `<div style="position:absolute;left:0px;top:0px;visibility:hidden;"><img src="${escapedUrl}"></div>`;
  return img;
}

export function writeAdUrl(adUrl, width, height) {
  let iframe = getEmptyIframe(height, width);
  iframe.src = adUrl;
  document.body.appendChild(iframe);
}

export function writeAdHtml(markup) {
  postscribe(document.body, markup);
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

export function getEmptyIframe(height, width) {
  let frame = document.createElement('iframe');
  frame.setAttribute('frameborder', 0);
  frame.setAttribute('scrolling', 'no');
  frame.setAttribute('marginheight', 0);
  frame.setAttribute('marginwidth', 0);
  frame.setAttribute('TOPMARGIN', 0);
  frame.setAttribute('LEFTMARGIN', 0);
  frame.setAttribute('allowtransparency', 'true');
  frame.setAttribute('width', width);
  frame.setAttribute('height', height);
  return frame;
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

export function loadScript(currentWindow, tagSrc, callback) {
  let doc = currentWindow.document;
  let scriptTag = doc.createElement('script');
  scriptTag.type = 'text/javascript';

  // Execute a callback if necessary
  if (callback && typeof callback === 'function') {
    if (scriptTag.readyState) {
      scriptTag.onreadystatechange = function() {
        if (scriptTag.readyState === 'loaded' || scriptTag.readyState === 'complete') {
          scriptTag.onreadystatechange = null;
          callback();
        }
      };
    } else {
      scriptTag.onload = function() {
        callback();
      };
    }
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
  let creativeComment = exports.getCreativeComment(bid);
  let wrapper = document.createElement('div');
  wrapper.appendChild(creativeComment);
  return wrapper.innerHTML;
}

/**
 * Insert element to passed target
 * @param {object} elm
 * @param {object} doc
 * @param {string} target
 */
export function insertElement(elm, doc, target) {
  doc = doc || document;
  let elToAppend;
  if (target) {
    elToAppend = doc.getElementsByTagName(target);
  } else {
    elToAppend = doc.getElementsByTagName('head');
  }
  try {
    elToAppend = elToAppend.length ? elToAppend : doc.getElementsByTagName('body');
    if (elToAppend.length) {
      elToAppend = elToAppend[0];
      elToAppend.insertBefore(elm, elToAppend.firstChild);
    }
  } catch (e) {}
}

export function triggerBurl(url) {
  const img = new Image();
  img.src = url;
};

export function transformAuctionTargetingData(dataObject) {
  const auctionKeyMap = {
    hb_adid: 'adId',
    hb_cache_host: 'cacheHost',
    hb_cache_path: 'cachePath',
    hb_cache_id: 'uuid',
    hb_format: 'mediaType',
    hb_env: 'env',
    hb_size: 'size'
  };

  let auctionData = {};

  // set keys defined in targetingMap object (if it's defined)
  const tarMap = dataObject.targetingMap || {};
  const tarMapKeys = Object.keys(tarMap);
  if (tarMapKeys.length > 0) {
    tarMapKeys.forEach(function(key) {
      if (Array.isArray(tarMap[key]) && tarMap[key].length > 0) {
        let internalKey = auctionKeyMap[key] || key;
        auctionData[internalKey] = tarMap[key][0];
      }
    });
  }

  // set keys not in targetingMap and/or the keys setup within a non-DFP adserver
  Object.keys(dataObject).forEach(function (key) {
    if (key !== 'targetingMap' && typeof dataObject[key] === 'string') {
      auctionData[key] = dataObject[key];
    }
  });

  return auctionData;
}

export function parseUrl(url) {
  let parsed = document.createElement('a');
  parsed.href = url;
  
  return {
    href: parsed.href,
    protocol: (parsed.protocol || '').replace(/:$/, ''),
    hostname: parsed.hostname,
    port: +parsed.port,
    pathname: parsed.pathname.replace(/^(?!\/)/, '/'),
    hash: (parsed.hash || '').replace(/^#/, ''),
    host: parsed.host || window.location.host
  };
}