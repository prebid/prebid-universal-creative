/**
 * Handles postMessage requests and responses for replacing native placeholder
 * values in native creative templates.
 */

/*
 * Native asset->key mapping from Prebid.js/src/constants.json
 * https://github.com/prebid/Prebid.js/blob/8635c91942de9df4ec236672c39b19448545a812/src/constants.json#L67
 */
const NATIVE_KEYS = {
  title: 'hb_native_title',
  body: 'hb_native_body',
  body2: 'hb_native_body2',
  privacyLink: 'hb_native_privacy',
  sponsoredBy: 'hb_native_brand',
  image: 'hb_native_image',
  icon: 'hb_native_icon',
  clickUrl: 'hb_native_linkurl',
  displayUrl: 'hb_native_displayurl',
  cta: 'hb_native_cta',
  rating: 'hb_native_rating',
  address: 'hb_native_address',
  downloads: 'hb_native_downloads',
  likes: 'hb_native_likes',
  phone: 'hb_native_phone',
  price: 'hb_native_price',
  salePrice: 'hb_native_saleprice',
};

const NATIVE_CLASS_IDS = {
  icon: 'pb-icon',
  image: 'pb-image'
};

export function newNativeAssetManager(win) {
  let callback;
  let errorCountEscapeHatch = 0;
  let tokenType = 'default';

  /*
   * Entry point to search for placeholderes and set up postmessage roundtrip
   * to retrieve native assets. Looks for placeholders for the given adId and
   * fires a callback after the native html is updated.
   */
  function loadAssets(adId, cb) {
    const placeholders = scanForPlaceholders(adId);

    if (placeholders.length > 0) {
      callback = cb;
      requestAssets(adId, placeholders);
    }
  }

  /*
   * Searches the DOM for placeholder values sent in by Prebid Native
   */
  function scanForPlaceholders(adId) {
    let placeholders = [];

    Object.keys(NATIVE_KEYS).forEach(function(key) {
      const placeholderKey = NATIVE_KEYS[key];
      const sendIdPlaceholder = `${placeholderKey}:${adId}`;
      const hardKeyPlaceholder = `%%${placeholderKey}%%`;

      let placeholderIndex = -1;
      let tokensToCheck = [sendIdPlaceholder];
  
      if (placeholderKey === NATIVE_KEYS.image) {
        tokensToCheck.push('pb-image');
      } else if (placeholderKey === NATIVE_KEYS.icon) {
        tokensToCheck.push('pb-icon');
      } else {
        tokensToCheck.push(hardKeyPlaceholder);
      }
      
      tokensToCheck.forEach(function(token) {
        if (win.document.body.innerHTML.indexOf(token) !== -1) {
          placeholderIndex = win.document.body.innerHTML.indexOf(token);
          if (tokenType === 'default') {
            tokenType = (token === sendIdPlaceholder) ? 'sendId' : 'hardKey';
          }
        }
      });

      if (~placeholderIndex) {
        placeholders.push(placeholderKey);
      }
    });

    return placeholders;
  }

  /*
   * Sends postmessage to Prebid for asset placeholders found in the native
   * creative template, and setups up a listener for when Prebid responds.
   */
  function requestAssets(adId, assets) {
    win.addEventListener('message', replaceAssets, false);

    const message = {
      message: 'Prebid Native',
      action: 'assetRequest',
      adId,
      assets,
    };

    win.parent.postMessage(JSON.stringify(message), '*');
  }

  /*
   * Postmessage listener for when Prebid responds with requested native assets.
   */
  function replaceAssets(event) {
    let data = {};

    try {
      data = JSON.parse(event.data);
    } catch (e) {
      if (errorCountEscapeHatch++ > 10) {
        /*
         * if for some reason Prebid never responds with the native assets,
         * get rid of this listener because other messages won't stop coming
         */
        win.removeEventListener('message', replaceAssets);
      }
      return;
    }

    if (data.message === 'assetResponse') {
      const body = win.document.body.innerHTML;
      const newHtml = replace(body, data);

      win.document.body.innerHTML = newHtml;
      if (tokenType === 'hardKey') insertImages(win.document.body, data);
      callback && callback();
      win.removeEventListener('message', replaceAssets);
    }
  }

  /**
   * Replaces occurrences of native placeholder values with their actual values
   * in the given document.
   */
  function replace(document, { assets, adId }) {
    let html = document;
    (assets || []).forEach(function(asset) {
      let tokenSyntax = (tokenType === 'sendId') ? `${NATIVE_KEYS[asset.key]}:${adId}` : `%%${NATIVE_KEYS[asset.key]}%%`;
      html = html.replace(tokenSyntax, asset.value);
    });

    return html;
  }

  /**
   * Adds the src attribute to specific img tags identified by the class name.
   * The value for the added src is dervied from either the native.icon or native.image bid assets.
   */
  function insertImages(document, { assets }) {
    (assets || []).forEach(function(asset) {
      if (asset.key === 'icon' || asset.key === 'image') {
        let imageElement = document.getElementsByClassName(NATIVE_CLASS_IDS[asset.key]);
        imageElement[0].setAttribute('src', asset.value);
      }
    });
  }

  return {
    loadAssets
  };
}
