/**
 *
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
  let errorCount = 0;

  /**
   *
   */
  function scanForPlaceholders(adId) {
    console.log('scanning for placeholders...', adId);

    // const placeholders = getPlaceholders();

    // if (placeholders.length > 0) {
    //   console.log(`Placeholders found!`, placeholders);
    //   getAssets(placeholders);
    // }
  }

  /**
   *
   */
  function getPlaceholders() {
    console.log('Finding native placeholders:');

    let placeholders = [];

    Object.keys(NATIVE_KEYS).forEach(key => {
      const value = NATIVE_KEYS[key];
      const placeholder = `${value}:`;
      const adIdLength = 14;

      const placeholderIndex = win.document.body.innerHTML.indexOf(placeholder);

      if (~placeholderIndex) {
        const placeholderWithAdId = win.document.body.innerHTML.slice(
          placeholderIndex,
          placeholderIndex + placeholder.length + adIdLength
        );

        placeholders.push(placeholderWithAdId);
      }
    });

    return placeholders;
  }

  /**
   *
   */
  function getAssets(placeholders) {
    win.addEventListener('message', replaceListener, false);

    const requestedAssets = placeholders.map(placeholder => placeholder.split(':')[0]);
    const adId = placeholders[0].split(':')[1];

    const message = {
      message: 'Prebid Native',
      action: 'requestAssets',
      adId,
      assets: requestedAssets,
    };

    win.parent.postMessage(JSON.stringify(message), '*');
  }

  /**
   *
   */
  function replaceListener(event) {
    var data = {};

    try {
      data = JSON.parse(event.data);
    } catch (e) {
      if (errorCount++ > 10) {
        win.removeEventListener('message', replaceListener);
      }
      return;
    }

    if (data.message === 'gotLink') {
      console.log('gotLink', data);
      replace(data);
      // attachClickListeners(findAdElements(AD_ANCHOR_CLASS_NAME));
      win.removeEventListener('message', replaceListener);
    }
  }

  /**
   *
   */
  function replace(data) {
    data.assets.forEach(asset => {
      win.document.body.innerHTML = win.document.body.innerHTML.replace(
        `${NATIVE_KEYS[asset.key]}:${data.adId}`,
        asset.value
      );
    });
  }

  return {
    scanForPlaceholders
  };
}
