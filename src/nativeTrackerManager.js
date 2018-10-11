/*
 * Script to handle firing impression and click trackers from native teamplates
 */

const AD_ANCHOR_CLASS_NAME = 'pb-click';
const AD_DATA_ADID_ATTRIBUTE = 'pbAdId';

// handle addEventListener gracefully in older browsers
function addEventHandler(element, event, func) {
  if (element.addEventListener) {
    element.addEventListener(event, func, true);
  } else if (element.attachEvent) {
    element.attachEvent('on' + event, func);
  }
};

function findAdElements(className) {
  var adElements = document.getElementsByClassName(className);
  return adElements || [];
}

function readAdIdFromElement(adElements) {
  let adId = (adElements.length > 0) &&
    adElements[0].attributes &&
    adElements[0].attributes[AD_DATA_ADID_ATTRIBUTE] &&
    adElements[0].attributes[AD_DATA_ADID_ATTRIBUTE].value;
  return adId || '';
}

function readAdIdFromEvent(event) {
  var adId =
    event &&
    event.target &&
    event.target.attributes &&
    event.target.attributes[AD_DATA_ADID_ATTRIBUTE] &&
    event.target.attributes[AD_DATA_ADID_ATTRIBUTE].value;

  return adId || '';
}

function loadClickTrackers(event) {
  var adId = readAdIdFromEvent(event);
  fireTracker(adId, 'click');
}

function loadImpTrackers(adElements) {
  var adId = readAdIdFromElement(adElements);
  fireTracker(adId, 'impression');
}

function fireTracker(adId, action) {
  if (adId === '') {
    console.warn('Prebid tracking event was missing \'adId\'.  Was adId macro set in the HTML attribute ' + AD_DATA_ADID_ATTRIBUTE + 'on the ad\'s anchor element');
  } else {
    var message = { message: 'Prebid Native', adId: adId };

    // fires click trackers when called via link
    if (action === 'click') {
      message.action = 'click';
    }

    window.parent.postMessage(JSON.stringify(message), '*');
  }
}

// START OF MAIN CODE
function start() {
  var adElements = findAdElements(AD_ANCHOR_CLASS_NAME);
  for (var i = 0; i < adElements.length; i++) {
    addEventHandler(adElements[i], 'click', loadClickTrackers);
  }

  // fires native impressions on creative load
  if (adElements.length > 0) {
    loadImpTrackers(adElements);
  }
}

start();
