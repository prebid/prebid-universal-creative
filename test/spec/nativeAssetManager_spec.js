import {expect} from 'chai';
import {merge} from 'lodash';
import {newNativeAssetManager} from 'src/nativeAssetManager';
import {mocks} from 'test/helpers/mocks';
import * as utils from 'src/utils';
import {prebidMessenger} from '../../src/messaging.js';

const ORIGIN = 'https://origin.com'
const AD_ID = 'abc123';
const AD_ID2 = 'def456';
const NATIVE_KEYS = {
  title: 'hb_native_title',
  body: 'hb_native_body',
  body2: 'hb_native_body2',
  privacyLink: 'hb_native_privacy',
  privacyIcon: 'hb_native_privicon',
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
  rendererUrl: 'hb_renderer_url',
};

const mockDocument = {
  getWindowObject: function() {
    return {
      addEventListener: sinon.spy(),
      removeEventListener: sinon.spy(),
      parent: { postMessage: sinon.spy() },
    };
  }
};

// creates mock postmessage response from prebid's native.js:getAssetMessage
function createResponder(assets,url,template, clickUrlUnesc = '') {
  return function(type, listener) {
    if (type !== 'message') { return; }

    const data = {
      message: 'assetResponse',
      adId: AD_ID, assets,
      adTemplate:template,
      rendererUrl:url,
    };
    listener({ data: JSON.stringify(data), origin: ORIGIN});
  };
}

// creates mock postmessage response from prebid's native.js:getAssetMessage
function createAllResponder(nativePayload, url, template, key = 'assets') {
  return function(type, listener) {
    if (type !== 'message') { return; }

    const data = { message: 'assetResponse', adId: AD_ID, adTemplate:template, rendererUrl:url };
    data[key] = nativePayload;
    listener({ data: JSON.stringify(data), origin: ORIGIN });
  };
}

// creates mock postmessage response from prebid's native.js:getAssetMessage using alternative id
function createAltAllResponder(assets,url,template) {
  return function(type, listener) {
    if (type !== 'message') { return; }

    const data = { message: 'assetResponse', adId: AD_ID2, assets, adTemplate:template, rendererUrl:url };
    listener({ data: JSON.stringify(data), origin: ORIGIN});
  };
}

// creates mock html markup responsse from renderUrl
function generateRenderer(assets) {
      let newhtml = '<div class=\"sponsored-post\">\r\n  <div class=\"thumbnail\"><\/div>\r\n  <div class=\"content\">\r\n  <h1>\r\n    <a href=\"##hb_native_linkurl##\" target=\"_blank\" class=\"pb-click\">##hb_native_title##<\/a>\r\n   <\/h1>\r\n    <p>##hb_native_body##<\/p>\r\n    \t<div class=\"attribution\">\r\n                   \t<img class=\"pb-icon\" src=\"##hb_native_image##\" alt=\"icon\" height=\"150\" width=\"50\">\r\n \t\r\n           \t<\/div>\r\n\t<\/div>\r\n<\/div>';

      (assets || []).forEach(asset => {
          const searchString = '##'+`${NATIVE_KEYS[asset.key]}`+'##';
          const searchStringRegex = new RegExp(searchString, 'g');
          newhtml = newhtml.replace(searchStringRegex, asset.value);
      });

      return newhtml;
}

describe('nativeAssetManager', () => {
  let win;

  function makeManager(args, mkMessenger = prebidMessenger) {
    return newNativeAssetManager(win, {
      pubUrl: ORIGIN,
      ...args
    }, mkMessenger);
  }

  beforeEach(() => {
    win = merge(mocks.createFakeWindow(), mockDocument.getWindowObject());
  });

  describe('safe frames enabled', () => {

    beforeEach(() => {
      win.$sf = {
        ext: {}
      }
    });

    it('replaces native placeholders with their asset values', () => {
      win.document.body.innerHTML = `
        <h1>hb_native_title</h1>
        <p>hb_native_body:${AD_ID}</p>
        <a href="hb_native_linkurl:${AD_ID}">Click Here</a>
      `;
      win.addEventListener = createResponder([
        { key: 'body', value: 'new value' },
        { key: 'clickUrl', value: 'http://www.example.com' },
      ]);

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.include('<p>new value</p>');
      expect(win.document.body.innerHTML).to.include(`
        <a href="http://www.example.com">Click Here</a>
      `);
      // title was not a requested asset so this should stay as is
      expect(win.document.body.innerHTML).to.include('<h1>hb_native_title</h1>');
    });

    it('replaces all occurrences of the placeholder if it appears more than once', () => {
      win.document.body.innerHTML = `
        <a href="hb_native_linkurl:${AD_ID}">Click Here</a>
        <a href="hb_native_linkurl:${AD_ID}">Or Here</a>
      `;
      win.addEventListener = createResponder([{ key: 'clickUrl', value: 'http://www.example.com' }]);

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.include(`
        <a href="http://www.example.com">Click Here</a>
      `);
      expect(win.document.body.innerHTML).to.include(`
        <a href="http://www.example.com">Or Here</a>
      `);
    });

    it('attaches and removes message listeners', (done) => {
      win.document.body.innerHTML = `<h1>hb_native_title:${AD_ID}</h1>`;
      const responder = createResponder();
      win.addEventListener = function (evType, listener) {
        setTimeout(() => responder(evType, listener), 0);
      }

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);
      setTimeout(() => {
        expect(win.removeEventListener.callCount).to.equal(1);
        done();
      }, 0);
    });

    it('replaces native placeholders with their asset values from adTemplate', () => {
      const html = `<script>
                let nativeTag = {};
                nativeTag.adTemplate = "<div class=\"sponsored-post\">\r\n  <div class=\"thumbnail\"><\/div>\r\n  <div class=\"content\">\r\n  <h1>\r\n    <a href=\"##hb_native_linkurl##\" target=\"_blank\" class=\"pb-click\">##hb_native_title##<\/a>\r\n   <\/h1>\r\n    <p>##hb_native_body##<\/p>\r\n    \t<div class=\"attribution\">\r\n                   \t<img class=\"pb-icon\" src=\"##hb_native_image##\" alt=\"icon\" height=\"150\" width=\"50\">\r\n \t\r\n           \t<\/div>\r\n\t<\/div>\r\n<\/div>";
                nativeTag.pubUrl = "https://www.url.com";
                nativeTag.adId = "`+AD_ID+`";
                nativeTag.requestAllAssets = true;
                window.pbNativeTag.renderNativeAd(nativeTag);
        </script>`;
      win.pbNativeData = {
        pubUrl : 'https://www.url.com',
        adId : AD_ID,
        adTemplate : '<div class=\"sponsored-post\">\r\n  <div class=\"thumbnail\"><\/div>\r\n  <div class=\"content\">\r\n  <h1>\r\n    <a href=\"##hb_native_linkurl##\" target=\"_blank\" class=\"pb-click\">##hb_native_title##<\/a>\r\n   <\/h1>\r\n    <p>##hb_native_body##<\/p>\r\n    \t<div class=\"attribution\">\r\n                   \t<img class=\"pb-icon\" src=\"##hb_native_image##\" alt=\"icon\" height=\"150\" width=\"50\">\r\n \t\r\n           \t<\/div>\r\n\t<\/div>\r\n<\/div>'
      };

      win.document.body.innerHTML = html;
      win.addEventListener = createResponder([
        { key: 'body', value: 'Body content' },
        { key: 'title', value: 'new value' },
        { key: 'clickUrl', value: 'http://www.example.com' },
        { key: 'image', value: 'http://www.image.com/picture.jpg' },
      ]);

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.include(`<a href="http://www.example.com" target="_blank" class="pb-click">new value</a>`);
      expect(win.document.body.innerHTML).to.include(`<img class="pb-icon" src="http://www.image.com/picture.jpg" alt="icon" height="150" width="50">`);
      expect(win.document.body.innerHTML).to.include(`<p>Body content</p>`);
    });

    it('loads rendererUrl and passes assets to renderAd - writes response to innerHtml', () => {
      const html = `<script>
                let nativeTag = {};
                nativeTag.pubUrl = "https://www.url.com";
                nativeTag.adId = "`+AD_ID+`";
                nativeTag.requestAllAssets = true;
                window.pbNativeTag.renderNativeAd(nativeTag);
        </script>`;
      win.pbNativeData = {
        pubUrl : 'https://www.url.com',
        adId : AD_ID,
        rendererUrl : 'https://www.renderer.com/render.js',
        requestAllAssets : true
      };

      win.document.body.innerHTML = html;
      win.renderAd = generateRenderer;

      win.addEventListener = createAllResponder([
        { key: 'body', value: 'Body content' },
        { key: 'title', value: 'new value' },
        { key: 'clickUrl', value: 'http://www.example.com' },
        { key: 'image', value: 'http://www.image.com/picture.jpg' },
      ],null,null);

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.include(`<a href="http://www.example.com" target="_blank" class="pb-click">new value</a>`);
      expect(win.document.body.innerHTML).to.include(`<img class="pb-icon" src="http://www.image.com/picture.jpg" alt="icon" height="150" width="50">`);
      expect(win.document.body.innerHTML).to.include(`<p>Body content</p>`);
    });

    it('adId does not match, so assets are not replaced', () => {
      const html = `<script>
                let nativeTag = {};
                nativeTag.pubUrl = "https://www.url.com";
                nativeTag.adId = "OTHERID123";
                nativeTag.requestAllAssets = true;
                window.pbNativeTag.renderNativeAd(nativeTag);
        </script>`;
      win.pbNativeData = {
        pubUrl : 'https://www.url.com',
        adId : 'OTHERID123',
        rendererUrl : 'https://www.renderer.com/render.js',
        requestAllAssets : true
      };

      win.document.body.innerHTML = html;
      win.renderAd = generateRenderer;

      win.addEventListener = createAllResponder([
        { key: 'body', value: 'Body content' },
        { key: 'title', value: 'new value' },
        { key: 'clickUrl', value: 'http://www.example.com' },
        { key: 'image', value: 'http://www.image.com/picture.jpg' },
      ],null,null);

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.equal(`<script>
                let nativeTag = {};
                nativeTag.pubUrl = "https://www.url.com";
                nativeTag.adId = "OTHERID123";
                nativeTag.requestAllAssets = true;
                window.pbNativeTag.renderNativeAd(nativeTag);
        </script>`);
    });

    it('adId does not match on first response, so assets are not replaced until match on second response', () => {
      const html = `<script>
                let nativeTag = {};
                nativeTag.pubUrl = "https://www.url.com";
                nativeTag.adId = "def456";
                nativeTag.requestAllAssets = true;
                window.pbNativeTag.renderNativeAd(nativeTag);
        </script>`;
      win.pbNativeData = {
        pubUrl : 'https://www.url.com',
        adId : 'def456',
        rendererUrl : 'https://www.renderer.com/render.js',
        requestAllAssets : true
      };

      win.document.body.innerHTML = html;
      win.renderAd = generateRenderer;

      win.addEventListener = createAllResponder([
        { key: 'body', value: 'Body No Replace' },
        { key: 'title', value: 'new value no replace' },
        { key: 'clickUrl', value: 'http://www.example.com/noreplace' },
        { key: 'image', value: 'http://www.image.com/picture.jpg?noreplace=true' },
      ],null,null);

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID2);

      expect(win.document.body.innerHTML).to.equal(`<script>
                let nativeTag = {};
                nativeTag.pubUrl = "https://www.url.com";
                nativeTag.adId = "def456";
                nativeTag.requestAllAssets = true;
                window.pbNativeTag.renderNativeAd(nativeTag);
        </script>`);

      win.addEventListener = createAltAllResponder([
        { key: 'body', value: 'Body content' },
        { key: 'title', value: 'new value' },
        { key: 'clickUrl', value: 'http://www.example.com' },
        { key: 'image', value: 'http://www.image.com/picture.jpg' },
      ],null,null);

      nativeAssetManager.loadAssets(AD_ID2);

      expect(win.document.body.innerHTML).to.include(`<a href="http://www.example.com" target="_blank" class="pb-click">new value</a>`);
      expect(win.document.body.innerHTML).to.include(`<img class="pb-icon" src="http://www.image.com/picture.jpg" alt="icon" height="150" width="50">`);
      expect(win.document.body.innerHTML).to.include(`<p>Body content</p>`);
    });

    it('no placeholders found but requests all assets flag set - rendererUrl', () => {
      const url = 'https://www.renderer.com/render.js';
      win.pbNativeData = {
        pubUrl : 'https://www.url.com',
        adId : AD_ID,
        rendererUrl : 'https://www.renderer.com/render.js',
        requestAllAssets : true
      };

      win.document.body.innerHTML = '';
      win.renderAd = generateRenderer;

      win.addEventListener = createAllResponder([
        { key: 'body', value: 'Body content' },
        { key: 'title', value: 'new value' },
        { key: 'clickUrl', value: 'http://www.example.com' },
        { key: 'image', value: 'http://www.image.com/picture.jpg' },
      ],url,null);

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.include(`<a href="http://www.example.com" target="_blank" class="pb-click">new value</a>`);
      expect(win.document.body.innerHTML).to.include(`<img class="pb-icon" src="http://www.image.com/picture.jpg" alt="icon" height="150" width="50">`);
      expect(win.document.body.innerHTML).to.include(`<p>Body content</p>`);
    });

    it("no placeholders found but requests all assets flag set - adTemplate - openRTB", () => {
      const template = `
  <div class="sponsored-post">
    <div class="thumbnail">
    </div>
    <div class="content">
      <h1>
        <a href="##hb_native_linkurl##" target="_blank" class="pb-click">##hb_native_asset_id_1##</a>
      </h1>
      <p>##hb_native_asset_id_2##</p>
      <div class="attribution">
        <img class="pb-icon" src="##hb_native_asset_id_3##" alt="icon" height="150" width="50">
      </div>
      <h2>##hb_native_asset_id_1##</h2>
      <p>##hb_native_asset_id_4##</p>
    </div>
  </div>
  `;
      win.pbNativeData = {
        pubUrl: "https://www.url.com",
        adId: AD_ID,
        requestAllAssets: true,
      };

      win.document.body.innerHTML = "";

      win.addEventListener = createAllResponder(
        {
          assets: [
            {
              id: 1,
              title: {
                text: "new value",
              },
            },
            {
              id: 2,
              data: {
                value: "Body content",
              },
            },
            {
              id: 3,
              img: {
                url: "http://www.image.com/picture.jpg",
              },
            },
          ],
          link: {
            url: "http://www.example.com",
          },

        },
        null,
        template,
        "ortb"
      );

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.include(
        `<a href="http://www.example.com" target="_blank" class="pb-click">new value</a>`
      );
      expect(win.document.body.innerHTML).to.include(
        `<img class="pb-icon" src="http://www.image.com/picture.jpg" alt="icon" height="150" width="50">`
      );
      expect(win.document.body.innerHTML).to.include(`<p>Body content</p>`);

      // ##hb_native_asset_id_4## was not returned in the response, it should
      // be transformed into an empty string
      expect(win.document.body.innerHTML).to.not.include(`##hb_native_asset_id_4##`);

      // test that we are replacing ALL asset occurrences
      expect(([...win.document.body.innerHTML.match(/new value/g)] || []).length, "expected 2 occurrences of \"new value\"").to.equal(2);
    });

    it('no placeholders found but requests all assets flag set - adTemplate', () => {
      const template = '<div class=\"sponsored-post\">\r\n  <div class=\"thumbnail\"><\/div>\r\n  <div class=\"content\">\r\n  <h1>\r\n    <a href=\"##hb_native_linkurl##\" target=\"_blank\" class=\"pb-click\">##hb_native_title##<\/a>\r\n   <\/h1>\r\n    <p>##hb_native_body##<\/p>\r\n    \t<div class=\"attribution\">\r\n                   \t<img class=\"pb-icon\" src=\"##hb_native_image##\" alt=\"icon\" height=\"150\" width=\"50\">\r\n \t\r\n           \t<\/div>\r\n\t<\/div>\r\n<\/div>';
      win.pbNativeData = {
        pubUrl : 'https://www.url.com',
        adId : AD_ID,
        requestAllAssets : true
      };

      win.document.body.innerHTML = '';

      win.addEventListener = createAllResponder([
        { key: 'body', value: 'Body content' },
        { key: 'title', value: 'new value' },
        { key: 'clickUrl', value: 'http://www.example.com' },
        { key: 'image', value: 'http://www.image.com/picture.jpg' },
      ],null,template);

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.include(`<a href="http://www.example.com" target="_blank" class="pb-click">new value</a>`);
      expect(win.document.body.innerHTML).to.include(`<img class="pb-icon" src="http://www.image.com/picture.jpg" alt="icon" height="150" width="50">`);
      expect(win.document.body.innerHTML).to.include(`<p>Body content</p>`);
    });

    it('no placeholders found but assets defined in nativeTag - adTemplate', () => {
      const template = '<div class=\"sponsored-post\">\r\n  <div class=\"thumbnail\"><\/div>\r\n  <div class=\"content\">\r\n  <h1>\r\n    <a href=\"##hb_native_linkurl##\" target=\"_blank\" class=\"pb-click\">##hb_native_title##<\/a>\r\n   <\/h1>\r\n    <p>##hb_native_body##<\/p>\r\n    \t<div class=\"attribution\">\r\n                   \t<img class=\"pb-icon\" src=\"##hb_native_image##\" alt=\"icon\" height=\"150\" width=\"50\">\r\n \t\r\n           \t<\/div>\r\n\t<\/div>\r\n<\/div>';
      win.pbNativeData = {
        pubUrl : 'https://www.url.com',
        adId : AD_ID,
        assetsToReplace: ['image','hb_native_body','clickUrl','hb_native_title']
      };

      win.document.body.innerHTML = '';

      win.addEventListener = createAllResponder([
        { key: 'body', value: 'Body content' },
        { key: 'title', value: 'new value' },
        { key: 'clickUrl', value: 'http://www.example.com' },
        { key: 'image', value: 'http://www.image.com/picture.jpg' },
      ],null,template);

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.include(`<a href="http://www.example.com" target="_blank" class="pb-click">new value</a>`);
      expect(win.document.body.innerHTML).to.include(`<img class="pb-icon" src="http://www.image.com/picture.jpg" alt="icon" height="150" width="50">`);
      expect(win.document.body.innerHTML).to.include(`<p>Body content</p>`);
    });

    it('does not replace anything if no placeholders found', () => {
      const html = `
        <h1>Native Ad</h1>
        <p>Cool Description</p>
        <a href="http://www.example.com">Click</a>
      `;

      win.document.body.innerHTML = html;
      win.addEventListener = createResponder();

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.equal(html);
    });

    it('replace mobile native placeholder with their values', function() {
      win.document.body.innerHTML = `
        <h1>hb_native_cta</h1>
        <p>hb_native_body</p>
        <a href="hb_native_linkurl">Click Here</a>
      `;

      let cb = sinon.spy();
      let targetingData = {
        uuid: '123'
      }

      sinon.stub(utils, 'sendRequest').callsFake(function(arg1, cb) {
        let response = JSON.stringify({
          id: '6572251357847878203',
          impid: 'some-imp-id',
          price: 10,
          adm: '{"assets":[{"id":1,"img":{"type":3,"url":"http://vcdn.adnxs.com/p/creative-image/f8/7f/0f/13/f87f0f13-230c-4f05-8087-db9216e393de.jpg","w":989,"h":742,"ext":{"appnexus":{"prevent_crop":0}}}},{"title":{"text":"This is a Prebid Native Creative"}},{"id":2,"data":{"type":1,"value":"Prebid.org"}},{"id":3,"data":{"type":2,"value":"new value"}}],"link":{"url":"http://example.com"},"imptrackers":["http://some-tracker.com"],"jstracker":"\\u003cscript type=\\"text/javascript\\" async=\\"true\\" src=\\"http://cdn.adnxs.com/v/app/179/trk.js#app;vk=appnexus.com-omid;tv=app-native-23h;dom_id=%native_dom_id%;st=2;d=1x1;vc=iab;vid_ccr=1;tag_id=13232354;cb=http%3A%2F%2Fnym1-ib.adnxs.com%2Fvevent%3Fan_audit%3D0%26test%3D1%26e%3DwqT_3QLXB2zXAwAAAwDWAAUBCJqev-0FEN2mtMzg8dSSPxj_EQEQASo2CQAFAQgkQBEFCAwAJEAZEQkAIREJACkRCQAxEQmoMOLRpwY47UhA7UhIAlC8yb4uWJzxW2AAaM26dXjjrAWAAQGKAQNVU0SSAQEG8FKYAQGgAQGoAQGwAQC4AQLAAQPIAQLQAQDYAQDgAQHwAQCKAjt1ZignYScsIDI1Mjk4ODUsIDE1NzE4MDI5MDYpO3VmKCdyJywgOTc0OTQyMDQsIC4eAPQOAZICuQIhTEVEX1hnajgtTHdLRUx6SnZpNFlBQ0NjOFZzd0FEZ0FRQVJJN1VoUTR0R25CbGdBWVBfX19fOFBhQUJ3QVhnQmdBRUJpQUVCa0FFQm1BRUJvQUVCcUFFRHNBRUF1UUh6cldxa0FBQWtRTUVCODYxcXBBQUFKRURKQWJSM21tYW5MdWNfMlFFQUFBQUFBQUR3UC1BQkFQVUJBQUFBQUpnQ0FLQUNBTFVDQUFBQUFMMENBQUFBQU1BQ0FjZ0NBZEFDQWRnQ0FlQUNBT2dDQVBnQ0FJQURBWmdEQWFnRF9QaThDcm9EQ1U1WlRUSTZORFl6Tk9BRHBSU0lCQUNRQkFDWUJBSEJCQUFBQUEJgwh5UVEJCQEBGE5nRUFQRUUBCwkBUEQ0QkFDSUJab2uaAokBIVp3LWhMQTY9ASRuUEZiSUFRb0FEFThUa1FEb0pUbGxOTWpvME5qTTBRS1VVUxFoDFBBX1URDAxBQUFXHQwAWR0MAGEdDABjHQzweWVBQS7YAgDgAq2YSIADAYgDAJADAJgDFKADAaoDAMAD4KgByAMA2AMA4AMA6AMC-AMAgAQAkgQJL29wZW5ydGIymAQAqAQAsgQMCAAQABgAIAAwADgAuAQAwAQAyAQA0gQOOTMyNSNOWU0yOjQ2MzTaBAIIAeAEAPAEQcCQggUab3JnLnByZWJpZC5tb2JpbGUuYXBpMWRlbW-IBQGYBQCgBXE4QP8BqgUHc29tZS1pZMAFAMkFaRgU8D_SBQkJCQw8AADYBQHgBQHwBZn0IfoFBAGUKJAGAZgGALgGAMEGCSU48D_IBgDQBvUv2gYWChAAOgEAUBAAGADgBgzyBgIIAIAHAYgHAKAHQQ..%26s%3Da7b19f6eede870d487a7bec88354794855bf8161;ts=1571802906;cet=0;cecb=\\"\\u003e\\u003c/script\\u003e\", \"eventtrackers\":[{\"type\": 1, \"method\": 1, \"url\": \"eventtracker-image\"},{\"type\": 1, \"method\": 2, \"url\": \"eventtracker-js\"}]}',
          adid: '97494204',
          adomain: [ 'http://prebid.org' ],
          iurl: 'http://nym1-ib.adnxs.com/cr?id=97494204',
          cid: '9325',
          crid: '97494204',
          cat: [ 'IAB3-1' ],
          ext: {
            appnexus: {
                brand_id: 555545,
                auction_id: 4550134868038456300,
                bidder_id: 2,
                bid_ad_type: 3
              }
            }
        });
        cb(response);
      });

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadMobileAssets(targetingData, cb);

      utils.sendRequest.restore();

      expect(win.document.body.innerHTML).to.include('<p>new value</p>');
      expect(win.document.body.innerHTML).to.include(`
        <a href="http://example.com">Click Here</a>
      `);
      // cta was not in the response so it should default to an empty string
      expect(win.document.body.innerHTML).to.include('<h1></h1>');
      expect(cb.getCall(0).args[0]).to.haveOwnProperty('eventtrackers');
    })
  })

  describe('safe frame disabled', () => {

    beforeEach(() => {
      win.parent.frames = [win];
      win.parent.document = {
        getElementsByTagName: sinon.stub().returns([{
          contentWindow: win,
          parentElement: {
            getBoundingClientRect: () => ({
              width: 600
            }),
            children: [{
              width: '1',
              height: '1'
            }]
          }
        }])
      }
    })

    it('should set the iframe to the width of the container', () => {
      const html = `<script>
                  let nativeTag = {};
                nativeTag.adTemplate = "<div class=\"sponsored-post\">\r\n  <div class=\"thumbnail\"><\/div>\r\n  <div class=\"content\">\r\n  <h1>\r\n    <a href=\"##hb_native_linkurl##\" target=\"_blank\" class=\"pb-click\">##hb_native_title##<\/a>\r\n   <\/h1>\r\n    <p>##hb_native_body##<\/p>\r\n    \t<div class=\"attribution\">\r\n                   \t<img class=\"pb-icon\" src=\"##hb_native_image##\" alt=\"icon\" height=\"150\" width=\"50\">\r\n \t\r\n           \t<\/div>\r\n\t<\/div>\r\n<\/div>";
                nativeTag.pubUrl = "https://www.url.com";
                nativeTag.adId = "`+AD_ID+`";
                nativeTag.requestAllAssets = true;
                window.pbNativeTag.renderNativeAd(nativeTag);
        </script>`;
      win.pbNativeData = {
        pubUrl : 'https://www.url.com',
        adId : AD_ID,
        adTemplate : '<div class=\"sponsored-post\">\r\n  <div class=\"thumbnail\"><\/div>\r\n  <div class=\"content\">\r\n  <h1>\r\n    <a href=\"##hb_native_linkurl##\" target=\"_blank\" class=\"pb-click\">##hb_native_title##<\/a>\r\n   <\/h1>\r\n    <p>##hb_native_body##<\/p>\r\n    \t<div class=\"attribution\">\r\n                   \t<img class=\"pb-icon\" src=\"##hb_native_image##\" alt=\"icon\" height=\"150\" width=\"50\">\r\n \t\r\n           \t<\/div>\r\n\t<\/div>\r\n<\/div>'
      };

      win.document.body.innerHTML = html;
      win.addEventListener = createResponder([
        { key: 'body', value: 'Body content' },
        { key: 'title', value: 'new value' },
        { key: 'clickUrl', value: 'http://www.example.com' },
        { key: 'image', value: 'http://www.image.com/picture.jpg' },
      ]);

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.include(`<a href="http://www.example.com" target="_blank" class="pb-click">new value</a>`);
      expect(win.document.body.innerHTML).to.include(`<img class="pb-icon" src="http://www.image.com/picture.jpg" alt="icon" height="150" width="50">`);
      expect(win.document.body.innerHTML).to.include(`<p>Body content</p>`);
      expect(win.document.body.style.width).to.equal('600px');
    });
  });

    describe('loadAssets calls error callback', () => {
        let recvMessages, reply;

        function mockMessenger() {
            return function (msg, cb) {
                reply = cb;
                recvMessages.push(msg);
            };
        }

        beforeEach(() => {
            recvMessages = [];
            reply = null;
        });


        it('when there are no assets to load', () => {
            win.pbNativeData = {adId: 123};
            const mgr = makeManager(mockMessenger);
            const cb = sinon.spy();
            const errCb = sinon.spy();
            mgr.loadAssets(123, cb, errCb);
            expect(cb.called).to.be.false;
            expect(errCb.called).to.be.true;
        });

        Object.entries({
            'all assets': {
                adId: 123,
                requestAllAssets: true
            },
            'some assets': {
                adId: 123,
            }
        }).forEach(([t, pbData]) => {
            describe(t, () => {
                let mgr;
                beforeEach(() => {
                    win.pbNativeData = pbData;
                    win.document.body.innerHTML = '##hb_native_title##';
                    mgr = makeManager({}, mockMessenger);
                });

                it('on response "timeout"', () => {
                    const cb = sinon.spy();
                    const err = sinon.spy();
                    mgr.loadAssets(123, cb, err);
                    for (let i = 0; i < 12; i++) {
                        reply({data: 'invalid'});
                    }
                    expect(cb.called).to.be.false;
                    expect(err.called).to.be.true;
                });

                it('on rendering exceptions', () => {
                    const cb = sinon.spy();
                    const err = sinon.spy();
                    mgr.loadAssets(123, cb, err);
                    win.renderAd = () => {
                        throw new Error();
                    };
                    reply({
                        data: JSON.stringify({
                            message: 'assetResponse',
                            adId: 123,
                            rendererUrl: 'mock-render'
                        })
                    });
                    expect(cb.called).to.be.false;
                    expect(err.called).to.be.true;
                });
            });
        });
    });

  describe('GAM macro %%CLICK_URL_UNESC%%', () => {
    it("should remove %%CLICK_URL_UNESC%% if there's no variable set", () => {
      const html = `<script>
        let nativeTag = {};
        nativeTag.adTemplate = "<div class=\"sponsored-post\">\r\n  <div class=\"thumbnail\"><\/div>\r\n  <div class=\"content\">\r\n  <h1>\r\n    <a href=\"%%CLICK_URL_UNESC%%##hb_native_linkurl##\" target=\"_blank\" class=\"pb-click\">##hb_native_title##<\/a>\r\n   <\/h1>\r\n    <p>##hb_native_body##<\/p>\r\n    \t<div class=\"attribution\">\r\n                   \t<img class=\"pb-icon\" src=\"##hb_native_image##\" alt=\"icon\" height=\"150\" width=\"50\">\r\n \t\r\n           \t<\/div>\r\n\t<\/div>\r\n<\/div>";
        nativeTag.pubUrl = "https://www.url.com";
        nativeTag.adId = "`+AD_ID+`";
        nativeTag.requestAllAssets = true;
        window.pbNativeTag.renderNativeAd(nativeTag);
      </script>`;
      win.pbNativeData = {
      pubUrl : 'https://www.url.com',
      adId : AD_ID,
      adTemplate : '<div class=\"sponsored-post\">\r\n  <div class=\"thumbnail\"><\/div>\r\n  <div class=\"content\">\r\n  <h1>\r\n    <a href=\"%%CLICK_URL_UNESC%%##hb_native_linkurl##\" target=\"_blank\" class=\"pb-click\">##hb_native_title##<\/a>\r\n   <\/h1>\r\n    <p>##hb_native_body##<\/p>\r\n    \t<div class=\"attribution\">\r\n                   \t<img class=\"pb-icon\" src=\"##hb_native_image##\" alt=\"icon\" height=\"150\" width=\"50\">\r\n \t\r\n           \t<\/div>\r\n\t<\/div>\r\n<\/div>'
      };

      win.document.body.innerHTML = html;
      win.addEventListener = createResponder([
      { key: 'body', value: 'Body content' },
      { key: 'title', value: 'new value' },
      { key: 'clickUrl', value: 'http://www.example.com' },
      { key: 'image', value: 'http://www.image.com/picture.jpg' },
      ]);

      const nativeAssetManager = makeManager();
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.include(`<a href="http://www.example.com" target="_blank" class="pb-click">new value</a>`);
    });

    it("should substitute %%CLICK_URL_UNESC%% with clickUrlUnesc value", () => {
      const html = `<script>
        let nativeTag = {};
        nativeTag.adTemplate = "<div class=\"sponsored-post\">\r\n  <div class=\"thumbnail\"><\/div>\r\n  <div class=\"content\">\r\n  <h1>\r\n    <a href=\"%%CLICK_URL_UNESC%%##hb_native_linkurl##\" target=\"_blank\" class=\"pb-click\">##hb_native_title##<\/a>\r\n   <\/h1>\r\n    <p>##hb_native_body##<\/p>\r\n    \t<div class=\"attribution\">\r\n                   \t<img class=\"pb-icon\" src=\"##hb_native_image##\" alt=\"icon\" height=\"150\" width=\"50\">\r\n \t\r\n           \t<\/div>\r\n\t<\/div>\r\n<\/div>";
        nativeTag.pubUrl = "https://www.url.com";
        nativeTag.adId = "`+AD_ID+`";
        nativeTag.requestAllAssets = true;
        window.pbNativeTag.renderNativeAd(nativeTag);
      </script>`;
      win.pbNativeData = {
      pubUrl : 'https://www.url.com',
      adId : AD_ID,
      adTemplate : '<div class=\"sponsored-post\">\r\n  <div class=\"thumbnail\"><\/div>\r\n  <div class=\"content\">\r\n  <h1>\r\n    <a href=\"%%CLICK_URL_UNESC%%##hb_native_linkurl##\" target=\"_blank\" class=\"pb-click\">##hb_native_title##<\/a>\r\n   <\/h1>\r\n    <p>##hb_native_body##<\/p>\r\n    \t<div class=\"attribution\">\r\n                   \t<img class=\"pb-icon\" src=\"##hb_native_image##\" alt=\"icon\" height=\"150\" width=\"50\">\r\n \t\r\n           \t<\/div>\r\n\t<\/div>\r\n<\/div>',
      };

      win.document.body.innerHTML = html;
      win.addEventListener = createResponder([
      { key: 'body', value: 'Body content' },
      { key: 'title', value: 'new value' },
      { key: 'clickUrl', value: 'http://www.example.com' },
      { key: 'image', value: 'http://www.image.com/picture.jpg' },
      ], null, null, );

      const nativeAssetManager = makeManager({ clickUrlUnesc: 'https://will.redirect/?to='});
      nativeAssetManager.loadAssets(AD_ID);

      expect(win.document.body.innerHTML).to.include(`<a href="https://will.redirect/?to=http://www.example.com" target="_blank" class="pb-click">new value</a>`);
    });
  });
});
