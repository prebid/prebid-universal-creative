import { expect } from 'chai';
import { merge } from 'lodash';
import { newNativeAssetManager } from 'src/nativeAssetManager';
import { mocks } from 'test/helpers/mocks';
import * as utils from 'src/utils';

const AD_ID = 'abc123';

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
function createResponder(assets) {
  return function(type, listener) {
    if (type !== 'message') { return; }

    const data = { message: 'assetResponse', adId: AD_ID, assets };
    listener({ data: JSON.stringify(data) });
  };
}

describe('nativeTrackerManager', () => {
  let win;

  beforeEach(() => {
    win = merge(mocks.createFakeWindow(), mockDocument.getWindowObject());
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

    const nativeAssetManager = newNativeAssetManager(win);
    nativeAssetManager.loadAssets(AD_ID);

    expect(win.document.body.innerHTML).to.include('<p>new value</p>');
    expect(win.document.body.innerHTML).to.include(`
      <a href="http://www.example.com">Click Here</a>
    `);
    // title was not a requested asset so this should stay as is
    expect(win.document.body.innerHTML).to.include('<h1>hb_native_title</h1>');
  });

  it('attaches and removes message listeners', () => {
    win.document.body.innerHTML = `<h1>hb_native_title:${AD_ID}</h1>`;
    win.addEventListener = createResponder();

    const nativeAssetManager = newNativeAssetManager(win);
    nativeAssetManager.loadAssets(AD_ID);

    expect(win.parent.postMessage.callCount).to.equal(1);
    expect(win.removeEventListener.callCount).to.equal(1);
  });

  it('does not replace anything if no placeholders found', () => {
    const html = `
      <h1>Native Ad</h1>
      <p>Cool Description</p>
      <a href="http://www.example.com">Click</a>
    `;

    win.document.body.innerHTML = html;
    win.addEventListener = createResponder();

    const nativeAssetManager = newNativeAssetManager(win);
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
      let response = JSON.stringify({"id":"6572251357847878203","impid":"some-imp-id","price":10,"adm":"{\"assets\":[{\"id\":1,\"img\":{\"type\":3,\"url\":\"http://vcdn.adnxs.com/p/creative-image/f8/7f/0f/13/f87f0f13-230c-4f05-8087-db9216e393de.jpg\",\"w\":989,\"h\":742,\"ext\":{\"appnexus\":{\"prevent_crop\":0}}}},{\"title\":{\"text\":\"This is a Prebid Native Creative\"}},{\"id\":2,\"data\":{\"type\":1,\"value\":\"Prebid.org\"}},{\"id\":3,\"data\":{\"type\":2,\"value\":\"new value\"}}],\"link\":{\"url\":\"http://example.com\"},\"imptrackers\":[\"http://some-tracker.com\"],\"jstracker\":\"\\u003cscript type=\\\"text/javascript\\\" async=\\\"true\\\" src=\\\"http://cdn.adnxs.com/v/app/179/trk.js#app;vk=appnexus.com-omid;tv=app-native-23h;dom_id=%native_dom_id%;st=2;d=1x1;vc=iab;vid_ccr=1;tag_id=13232354;cb=http%3A%2F%2Fnym1-ib.adnxs.com%2Fvevent%3Fan_audit%3D0%26test%3D1%26e%3DwqT_3QLXB2zXAwAAAwDWAAUBCJqev-0FEN2mtMzg8dSSPxj_EQEQASo2CQAFAQgkQBEFCAwAJEAZEQkAIREJACkRCQAxEQmoMOLRpwY47UhA7UhIAlC8yb4uWJzxW2AAaM26dXjjrAWAAQGKAQNVU0SSAQEG8FKYAQGgAQGoAQGwAQC4AQLAAQPIAQLQAQDYAQDgAQHwAQCKAjt1ZignYScsIDI1Mjk4ODUsIDE1NzE4MDI5MDYpO3VmKCdyJywgOTc0OTQyMDQsIC4eAPQOAZICuQIhTEVEX1hnajgtTHdLRUx6SnZpNFlBQ0NjOFZzd0FEZ0FRQVJJN1VoUTR0R25CbGdBWVBfX19fOFBhQUJ3QVhnQmdBRUJpQUVCa0FFQm1BRUJvQUVCcUFFRHNBRUF1UUh6cldxa0FBQWtRTUVCODYxcXBBQUFKRURKQWJSM21tYW5MdWNfMlFFQUFBQUFBQUR3UC1BQkFQVUJBQUFBQUpnQ0FLQUNBTFVDQUFBQUFMMENBQUFBQU1BQ0FjZ0NBZEFDQWRnQ0FlQUNBT2dDQVBnQ0FJQURBWmdEQWFnRF9QaThDcm9EQ1U1WlRUSTZORFl6Tk9BRHBSU0lCQUNRQkFDWUJBSEJCQUFBQUEJgwh5UVEJCQEBGE5nRUFQRUUBCwkBUEQ0QkFDSUJab2uaAokBIVp3LWhMQTY9ASRuUEZiSUFRb0FEFThUa1FEb0pUbGxOTWpvME5qTTBRS1VVUxFoDFBBX1URDAxBQUFXHQwAWR0MAGEdDABjHQzweWVBQS7YAgDgAq2YSIADAYgDAJADAJgDFKADAaoDAMAD4KgByAMA2AMA4AMA6AMC-AMAgAQAkgQJL29wZW5ydGIymAQAqAQAsgQMCAAQABgAIAAwADgAuAQAwAQAyAQA0gQOOTMyNSNOWU0yOjQ2MzTaBAIIAeAEAPAEQcCQggUab3JnLnByZWJpZC5tb2JpbGUuYXBpMWRlbW-IBQGYBQCgBXE4QP8BqgUHc29tZS1pZMAFAMkFaRgU8D_SBQkJCQw8AADYBQHgBQHwBZn0IfoFBAGUKJAGAZgGALgGAMEGCSU48D_IBgDQBvUv2gYWChAAOgEAUBAAGADgBgzyBgIIAIAHAYgHAKAHQQ..%26s%3Da7b19f6eede870d487a7bec88354794855bf8161;ts=1571802906;cet=0;cecb=\\\"\\u003e\\u003c/script\\u003e\"}","adid":"97494204","adomain":["http://prebid.org"],"iurl":"http://nym1-ib.adnxs.com/cr?id=97494204","cid":"9325","crid":"97494204","cat":["IAB3-1"],"ext":{"appnexus":{"brand_id":555545,"auction_id":4550134868038456157,"bidder_id":2,"bid_ad_type":3}}});
      cb(response);
    });

    const nativeAssetManager = newNativeAssetManager(win);
    nativeAssetManager.loadMobileAssets(targetingData, cb);

    expect(win.document.body.innerHTML).to.include('<p>new value</p>');
    expect(win.document.body.innerHTML).to.include(`
      <a href="http://example.com">Click Here</a>
    `);
    // cta was not a requested asset so this should stay as is
    expect(win.document.body.innerHTML).to.include('<h1>hb_native_cta</h1>');
    utils.sendRequest.restore();
  })
});
