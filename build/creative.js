/* prebid-universal-creative v0.1.0
Updated : 2018-02-07 */
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


/**
 * creative.js
 *
 * This file is inserted into the prebid creative as a placeholder for the winning prebid creative. It should support the following formats:
 * - Banner
 * - Outstream Video
 * - Mobile
 * - AMP creatives
 * - All safeFrame creatives
 */

var pbjs = {};

/**
 * @param  {object} doc
 * @param  {string} adId
 * @param  {object} dataObject
 */
pbjs.renderAd = function (doc, adId, dataObject) {
  if (isAMP()) {
    renderAmpAd(dataObject.host, dataObject.uuid);
  } else if (isCrossDomain()) {
    renderCrossDomain(adId, dataObject.pubUrl);
  } else {
    // assume legacy?
    renderLegacy(doc, adId);
  }
};

function getEmptyIframe(height, width) {
  var frame = document.createElement('iframe');
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

function renderLegacy(doc, adId) {
  var w = window;
  for (i = 0; i < 10; i++) {
    w = w.parent;
    if (w.pbjs) {
      try {
        w.pbjs.renderAd(document, adId);
        break;
      } catch (e) {
        continue;
      }
    }
  }
}

function renderCrossDomain(adId, pubUrl) {
  var urlParser = document.createElement('a');
  urlParser.href = pubUrl;
  var publisherDomain = urlParser.protocol + '//' + urlParser.host;
  var adServerDomain = urlParser.protocol + '//tpc.googlesyndication.com';

  function renderAd(ev) {
    var key = ev.message ? 'message' : 'data';
    var adObject = {};
    try {
      adObject = JSON.parse(ev[key]);
    } catch (e) {
      return;
    }

    var origin = ev.origin || ev.originalEvent.origin;
    if (adObject.message && adObject.message === 'Prebid Response' && publisherDomain === origin && adObject.adId === adId && (adObject.ad || adObject.adUrl)) {
      var body = window.document.body;
      var ad = adObject.ad;
      var url = adObject.adUrl;
      var width = adObject.width;
      var height = adObject.height;

      if (adObject.mediaType === 'video') {
        console.log('Error trying to write ad.');
      } else if (ad) {
        var frame = getEmptyIframe();
        body.appendChild(frame);
        frame.contentDocument.open();
        frame.contentDocument.write(ad);
        frame.contentDocument.close();
      } else if (url) {
        body.insertAdjacentHTML('beforeend', '<IFRAME SRC="' + url + '" FRAMEBORDER="0" SCROLLING="no" MARGINHEIGHT="0" MARGINWIDTH="0" TOPMARGIN="0" LEFTMARGIN="0" ALLOWTRANSPARENCY="true" WIDTH="' + width + '" HEIGHT="' + height + '"></IFRAME>');
      } else {
        console.log('Error trying to write ad. No ad for bid response id: ' + id);
      }
    }
  }

  function requestAdFromPrebid() {
    var message = JSON.stringify({
      message: 'Prebid Request',
      adId: adId,
      adServerDomain: adServerDomain
    });
    window.parent.postMessage(message, publisherDomain);
  }

  function listenAdFromPrebid() {
    window.addEventListener('message', renderAd, false);
  }

  listenAdFromPrebid();
  requestAdFromPrebid();
}

function renderAmpAd(cacheHost, uuid) {
  if (cacheHost === '') {
    cacheHost = 'prebid.adnxs.com';
  }
  // TODO pass in /path from creative since it might change
  var adUrl = 'https://' + cacheHost + '/pbc/v1/cache?uuid=' + uuid;

  var handler = function handler(response) {
    var bidObject;
    try {
      bidObject = JSON.parse(response);
    } catch (error) {}
    // Invalid json

    // Add seatbid
    if (bidObject.adm && bidObject.nurl) {
      var ad = bidObject.adm;
      ad += createTrackPixelHtml(decodeURIComponent(bidObject.nurl));
      writeAdHtml(ad);
    } else if (bidObject.adm) {
      var ad = bidObject.adm;
      writeAdHtml(ad);
    } else if (bidObject.nurl) {
      var adUrl = bidObject.nurl;
      // TODO test height and width. ortb spec represents width and height as w and h.
      writeAdUrl(adUrl, bidObject.h, bidObject.w);
    }
  };
  sendRequest(adUrl, handler);
}

function writeAdUrl(adUrl, height, width) {
  var iframe = getEmptyIframe(height, width);
  iframe.src = adUrl;
  document.body.appendChild(iframe);
}

function writeAdHtml(markup) {
  var parsed = parseHtml(markup);
  var scripts = parsed.querySelectorAll('script');
  for (var i = 0; i < scripts.length; i++) {
    domEval(scripts[i].innerHTML);
    scripts[i].parentNode.removeChild(scripts[i]);
  }
  var givenNodes = parsed.body.childNodes;
  for (var j = 0; j < givenNodes.length; j++) {
    document.body.appendChild(givenNodes[j]);
  }
}

function domEval(code, doc) {
  doc = doc || document;
  var script = doc.createElement('script');
  script.text = code;
  doc.head.appendChild(script);
}

function parseHtml(payload) {
  var parser = new DOMParser();
  return parser.parseFromString(payload, 'text/html');
}

function sendRequest(url, callback) {
  function reqListener() {
    callback(oReq.responseText);
  }

  var oReq = new XMLHttpRequest();
  oReq.addEventListener('load', reqListener);
  oReq.open('GET', url);
  oReq.send();
}

// TODO: Move this to new module when you add webpack
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
function isCodeOnPage() {
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
    var frameElement = window.frameElement;
    var parentElement = window.frameElement.parentNode;
    if (frameElement && parentElement) {
      return frameElement.id.indexOf('google_ads_iframe') > -1 && parentElement.id.indexOf('google_ads_iframe') > -1;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * @returns true if there is an AMP context object
 */
function isAmp() {
  try {
    var ampContext = window.context || window.parent.context;
    if (ampContext && ampContext.pageViewId) {
      return ampContext;
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * @returns true if the environment is a SafeFrame.
 */
function isSafeFrame() {
  return window.$sf && window.$sf.ext;
}

/**
 * @returns true if the environment is a dfp safe frame.
 */
function isDFPSafeFrame() {
  if (window.location && window.location.href) {
    var href = window.location.href;
    return isSafeFrame() && href.indexOf('google') !== -1 && href.indexOf('safeframe') !== -1;
  }
  return false;
}

/**
 * Return true if we are in an iframe and can't access the top window.
 */
function isCrossDomain() {
  return window.top !== window && !window.frameElement;
}

/**
 * Return true if we cannot document.write to a child iframe (this implies no allow-same-origin)
 */
function isSuperSandboxedIframe() {
  var sacrificialIframe = window.document.createElement('iframe');
  try {
    sacrificialIframe.setAttribute('style', 'display:none');
    window.document.body.appendChild(sacrificialIframe);
    sacrificialIframe.contentWindow._testVar = true;
    window.document.body.removeChild(sacrificialIframe);
    return false;
  } catch (e) {
    window.document.body.removeChild(sacrificialIframe);
    return true;
  }
}

function createTrackPixelHtml(url) {
  if (!url) {
    return '';
  }

  var escapedUrl = encodeURI(url);
  var img = '<div style="position:absolute;left:0px;top:0px;visibility:hidden;">';
  img += '<img src="' + escapedUrl + '"></div>';
  return img;
};

// function render() {
//   var { height, width, ad, mediaType, adUrl, renderer } = bid;

//   if (renderer && renderer.url) {
//     renderer.render(bid);
//   } else if ((doc === document && !utils.inIframe()) || mediaType === 'video') {
//     utils.logError(`Error trying to write ad. Ad render call ad id ${id} was prevented from writing to the main document.`);
//   } else if (ad) {
//     doc.write(ad);
//     doc.close();
//     setRenderSize(doc, width, height);
//   } else if (adUrl) {
//     var iframe = utils.createInvisibleIframe();
//     iframe.height = height;
//     iframe.width = width;
//     iframe.style.display = 'inline';
//     iframe.style.overflow = 'hidden';
//     iframe.src = adUrl;

//     utils.insertElement(iframe, doc, 'body');
//     setRenderSize(doc, width, height);
//   }
// }

/***/ })
/******/ ]);
//# sourceMappingURL=creative.js.map