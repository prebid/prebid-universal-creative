import { renderAmpOrMobileAd } from 'src/mobileAndAmpRender';
import * as postscribeRender from 'src/postscribeRender'
import * as utils from 'src/utils';
import { expect } from 'chai';
import { mocks } from 'test/helpers/mocks';
import { merge } from 'lodash';


function renderingMocks() {
  return {
    messages: [],
    getWindowObject: function () {
      return {
        document: {
          body: {
            appendChild: sinon.spy(),
          },
          createComment: () => true,
        },
        parent: {
          postMessage: sinon.spy(),
          $$PREBID_GLOBAL$$: {
            renderAd: sinon.spy(),
          },
        },
        postMessage: (message, domain) => {
          this.messages[0](message);
        },
        top: null,
        $sf: {
          ext: {
            register: sinon.spy(),
            expand: sinon.spy(),
          },
        },
        addEventListener: (type, listener, capture) => {
          this.messages.push(listener);
        },
        innerWidth: 300,
        innerHeight: 250,
      };
    },
  };
}

describe("renderingManager", function () {
  let xhr;
  let requests;

  before(function () {
    xhr = sinon.useFakeXMLHttpRequest();
    xhr.onCreate = (request) => requests.push(request);
  });

  beforeEach(function () {
    requests = [];
  });

  after(function () {
    xhr.restore();
  });

  describe("mobile creative", function () {
    let writeHtmlSpy;
    let sendRequestSpy;
    let triggerPixelSpy;
    let mockWin;

    before(function () {
      writeHtmlSpy = sinon.spy(postscribeRender, "writeAdHtml");
      sendRequestSpy = sinon.spy(utils, "sendRequest");
      triggerPixelSpy = sinon.spy(utils, "triggerPixel");
      mockWin = merge(
        mocks.createFakeWindow("http://example.com"),
        renderingMocks().getWindowObject()
      );
    });

    afterEach(function () {
      writeHtmlSpy.resetHistory();
      sendRequestSpy.resetHistory();
      triggerPixelSpy.resetHistory();
    });

    after(function () {
      writeHtmlSpy.restore();
      sendRequestSpy.restore();
      triggerPixelSpy.restore();
    });

    it("should render mobile app creative", function () {
      let ucTagData = {
        cacheHost: "example.com",
        cachePath: "/path",
        uuid: "123",
        size: "300x250",
      };

      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup",
        wurl: "https://test.prebidcache.wurl",
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
    });

    it("should render mobile app creative with missing cache wurl", function () {
      let ucTagData = {
        cacheHost: "example.com",
        cachePath: "/path",
        uuid: "123",
        size: "300x250",
      };

      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup",
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
    });

    it("should render mobile app creative using default cacheHost and cachePath", function () {
      let ucTagData = {
        uuid: "123",
        size: "300x250",
      };
      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup",
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://prebid.adnxs.com/pbc/v1/cache?uuid=123"
      );
    });

  //   it('should catch errors from creative', function (done) {
  //     window.addEventListener('error', e => {
  //       done(e.error);
  //     });

  //     const consoleErrorSpy = sinon.spy(console, 'error');

  //     let ucTagData = {
  //       cacheHost: 'example.com',
  //       cachePath: '/path',
  //       uuid: '123',
  //       size: '300x250'
  //     };

  //     renderAmpOrMobileAd(ucTagData, true);

  //     let response = {
  //       width: 300,
  //       height: 250,
  //       crid: 123,
  //       adm: '<script src="notExistingScript.js"></script>'
  //     };
  //     requests[0].respond(200, {}, JSON.stringify(response));

  //     setTimeout(() => {
  //       expect(consoleErrorSpy.callCount).to.equal(1);
  //       done();
  //     }, 10);
  //   });
  });

  describe("amp creative", function () {
    let writeHtmlSpy;
    let sendRequestSpy;
    let triggerPixelSpy;
    let mockWin;

    before(function () {
      writeHtmlSpy = sinon.spy(postscribeRender, "writeAdHtml");
      sendRequestSpy = sinon.spy(utils, "sendRequest");
      triggerPixelSpy = sinon.spy(utils, "triggerPixel");
      mockWin = merge(
        mocks.createFakeWindow("http://example.com"),
        renderingMocks().getWindowObject()
      );
    });

    afterEach(function () {
      writeHtmlSpy.resetHistory();
      sendRequestSpy.resetHistory();
      triggerPixelSpy.resetHistory();
    });

    after(function () {
      writeHtmlSpy.restore();
      sendRequestSpy.restore();
      triggerPixelSpy.restore();
    });

    it("should render amp creative", function () {
      let ucTagData = {
        cacheHost: "example.com",
        cachePath: "/path",
        uuid: "123",
        size: "300x250",
        hbPb: "10.00",
      };

      renderAmpOrMobileAd(ucTagData);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup${AUCTION_PRICE}",
        wurl: "https://test.prebidcache.wurl",
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal(
        "<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup10.00"
      );
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
      expect(triggerPixelSpy.args[0][0]).to.equal(
        "https://test.prebidcache.wurl"
      );
    });

    it("should replace AUCTION_PRICE with response.price over hbPb", function () {
      let ucTagData = {
        cacheHost: "example.com",
        cachePath: "/path",
        uuid: "123",
        size: "300x250",
        hbPb: "10.00",
      };

      renderAmpOrMobileAd(ucTagData);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        price: 12.5,
        adm: "ad-markup${AUCTION_PRICE}",
        wurl: "https://test.prebidcache.wurl",
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal(
        "<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup12.5"
      );
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
      expect(triggerPixelSpy.args[0][0]).to.equal(
        "https://test.prebidcache.wurl"
      );
    });

    it("should replace AUCTION_PRICE with with empty value when neither price nor hbPb exist", function () {
      let ucTagData = {
        cacheHost: "example.com",
        cachePath: "/path",
        uuid: "123",
        size: "300x250",
      };

      renderAmpOrMobileAd(ucTagData);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup${AUCTION_PRICE}",
        wurl: "https://test.prebidcache.wurl",
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal(
        "<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup"
      );
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
      expect(triggerPixelSpy.args[0][0]).to.equal(
        "https://test.prebidcache.wurl"
      );
    });
  });
});

