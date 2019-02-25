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

export function newNativeAssetManager(win) {
  let callback;
  let errorCountEscapeHatch = 0;

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

    Object.keys(NATIVE_KEYS).forEach(key => {
      const placeholderKey = NATIVE_KEYS[key];
      const placeholder = `${placeholderKey}:${adId}`;
      const placeholderIndex = win.document.body.innerHTML.indexOf(placeholder);

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
    var data = {};

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

    (assets || []).forEach(asset => {
      html = html.replace(`${NATIVE_KEYS[asset.key]}:${adId}`, asset.value);
    });

    return html;
  }

  return {
    loadAssets
  };
}
