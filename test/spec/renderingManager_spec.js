import { renderCrossDomain, renderLegacy, renderAmpOrMobileAd } from 'src/renderingManager';
import * as utils from 'src/utils';
import * as domHelper from 'src/domHelper';
import { expect } from 'chai';
import { mocks } from 'test/helpers/mocks';
import { merge } from 'lodash';

function renderingMocks() {
  return {
    messages: [],
        getWindowObject: function() {
    return {
      document: {
        body: {
          appendChild: sinon.spy()
        },
        createComment: () => true,
      },
      parent: {
        postMessage: sinon.spy(),
        $$PREBID_GLOBAL$$: {
          renderAd: sinon.spy()
        }
      },
      postMessage: (message, domain) => {
        this.messages[0](message);
      },
      top: null,
      $sf: {
        ext: {
          register: sinon.spy(),
          expand: sinon.spy()
        }
      },
      addEventListener: (type, listener, capture) => {
        this.messages.push(listener);
      },
      innerWidth: 300,
      innerHeight: 250
    }
  }
  }
}

function createMockIframe() {
  return {
    contentDocument: {
      open: sinon.spy(),
      write: sinon.spy(),
      close: sinon.spy()
    },
    style: {},
  }
}

describe('renderingManager', function() {
  let xhr;
  let requests;

  before(function() {
    xhr = sinon.useFakeXMLHttpRequest();
    xhr.onCreate = (request) => requests.push(request);
  });

  beforeEach(function() {
    requests = [];
  });

  after(function(){
    xhr.restore();
  });

  describe('mobile creative', function() {
    let writeHtmlSpy;
    let sendRequestSpy;
    let triggerPixelSpy;
    let mockWin;

    before(function() {
      writeHtmlSpy = sinon.spy(utils, 'writeAdHtml');
      sendRequestSpy = sinon.spy(utils, 'sendRequest');
      triggerPixelSpy = sinon.spy(utils, 'triggerPixel');
      mockWin = merge(mocks.createFakeWindow('http://example.com'), renderingMocks().getWindowObject());
    });

    afterEach(function() {
      writeHtmlSpy.resetHistory();
      sendRequestSpy.resetHistory();
      triggerPixelSpy.resetHistory();
    });

    after(function() {
      writeHtmlSpy.restore();
      sendRequestSpy.restore();
      triggerPixelSpy.restore();
    });

    it('should render mobile app creative', function() {
      let ucTagData = {
        cacheHost: 'example.com',
        cachePath: '/path',
        uuid: '123',
        size: '300x250'
      };

      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: 'ad-markup',
        wurl: 'https://test.prebidcache.wurl'
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestSpy.args[0][0]).to.equal('https://example.com/path?uuid=123');
    });

    it('should render mobile app creative with missing cache wurl', function() {
      let ucTagData = {
        cacheHost: 'example.com',
        cachePath: '/path',
        uuid: '123',
        size: '300x250'
      };

      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: 'ad-markup'
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestSpy.args[0][0]).to.equal('https://example.com/path?uuid=123');
    });

    it('should render mobile app creative using default cacheHost and cachePath', function() {
      let ucTagData = {
        uuid: '123',
        size: '300x250'
      };
      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: 'ad-markup'
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestSpy.args[0][0]).to.equal('https://prebid.adnxs.com/pbc/v1/cache?uuid=123');
    });

    it('should catch errors from creative', function (done) {
      window.addEventListener('error', e => {
        done(e.error);
      });

      const consoleErrorSpy = sinon.spy(console, 'error');

      let ucTagData = {
        cacheHost: 'example.com',
        cachePath: '/path',
        uuid: '123',
        size: '300x250'
      };

      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: '<script src="notExistingScript.js"></script>'
      };
      requests[0].respond(200, {}, JSON.stringify(response));

      setTimeout(()=>{
        expect(consoleErrorSpy.callCount).to.equal(1);
        done();
      }, 10);
    });
  });

  describe('amp creative', function() {
    let writeHtmlSpy;
    let sendRequestSpy;
    let triggerPixelSpy;
    let mockWin;

    before(function() {
      writeHtmlSpy = sinon.spy(utils, 'writeAdHtml');
      sendRequestSpy = sinon.spy(utils, 'sendRequest');
      triggerPixelSpy = sinon.spy(utils, 'triggerPixel');
      mockWin = merge(mocks.createFakeWindow('http://example.com'), renderingMocks().getWindowObject());
    });

    afterEach(function() {
      writeHtmlSpy.resetHistory();
      sendRequestSpy.resetHistory();
      triggerPixelSpy.resetHistory();
    });

    after(function() {
      writeHtmlSpy.restore();
      sendRequestSpy.restore();
      triggerPixelSpy.restore();
    });

    it('should render amp creative', function() {
      let ucTagData = {
        cacheHost: 'example.com',
        cachePath: '/path',
        uuid: '123',
        size: '300x250',
        hbPb: '10.00'
      };

      renderAmpOrMobileAd(ucTagData);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: 'ad-markup${AUCTION_PRICE}',
        wurl: 'https://test.prebidcache.wurl'
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal('<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup10.00');
      expect(sendRequestSpy.args[0][0]).to.equal('https://example.com/path?uuid=123');
      expect(triggerPixelSpy.args[0][0]).to.equal('https://test.prebidcache.wurl');
    });

    it('should replace AUCTION_PRICE with response.price over hbPb', function() {
      let ucTagData = {
        cacheHost: 'example.com',
        cachePath: '/path',
        uuid: '123',
        size: '300x250',
        hbPb: '10.00'
      };

      renderAmpOrMobileAd(ucTagData);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        price: 12.50,
        adm: 'ad-markup${AUCTION_PRICE}',
        wurl: 'https://test.prebidcache.wurl'
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal('<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup12.5');
      expect(sendRequestSpy.args[0][0]).to.equal('https://example.com/path?uuid=123');
      expect(triggerPixelSpy.args[0][0]).to.equal('https://test.prebidcache.wurl');
    });

    it('should replace AUCTION_PRICE with with empty value when neither price nor hbPb exist', function() {
      let ucTagData = {
        cacheHost: 'example.com',
        cachePath: '/path',
        uuid: '123',
        size: '300x250'
      };

      renderAmpOrMobileAd(ucTagData);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: 'ad-markup${AUCTION_PRICE}',
        wurl: 'https://test.prebidcache.wurl'
      };
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal('<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup');
      expect(sendRequestSpy.args[0][0]).to.equal('https://example.com/path?uuid=123');
      expect(triggerPixelSpy.args[0][0]).to.equal('https://test.prebidcache.wurl');
    });
  });

  describe('cross domain creative', function() {
    const ORIGIN = 'http://example.com';
    let parseStub;
    let iframeStub;
    let triggerPixelSpy;
    let mockWin;
    let ucTagData;
    let mockIframe;
    let eventSource;

    beforeEach(function(){
      mockIframe = createMockIframe();
      parseStub = sinon.stub(utils, 'parseUrl');
      iframeStub = sinon.stub(domHelper, 'getEmptyIframe').returns(mockIframe);
      triggerPixelSpy = sinon.stub(utils, 'triggerPixel');
      parseStub.returns({
        protocol: 'http',
        host: 'example.com'
      });
      iframeStub.returns(mockIframe);

      mockWin = merge(mocks.createFakeWindow('http://example.com'), renderingMocks().getWindowObject());
      ucTagData = {
        adId: '123',
        adServerDomain: 'mypub.com',
        pubUrl: ORIGIN,
      };
      eventSource = null;

      renderCrossDomain(mockWin, ucTagData.adId, ucTagData.adServerDomain, ucTagData.pubUrl);

    });

    afterEach(function() {
      parseStub.restore();
      iframeStub.restore();
      triggerPixelSpy.restore();
    });

    function mockPrebidResponse(msg)  {
      mockWin.postMessage({
        origin: ORIGIN,
        message: JSON.stringify(Object.assign({message: 'Prebid Response'}, msg))
      });
    }

    it('should render cross domain creative', function() {
      mockPrebidResponse({
        ad: 'ad',
        adUrl: ORIGIN,
        adId: '123',
        width: 300,
        height: 250
      });
      expect(mockIframe.contentDocument.write.args[0][0]).to.equal("ad");
    });

    describe('should signal event', () => {
      const RENDER_FAILED = 'adRenderFailed',
        RENDER_SUCCESS = 'adRenderSucceeded';

      function expectEventMessage(expected) {
        const actual = JSON.parse(mockWin.parent.postMessage.args[1][0]);
        sinon.assert.match(actual, Object.assign({message: 'Prebid Event'}, expected));
      }

      describe('AD_RENDER_FAILED', () => {
        it('on video ads', () => {
          mockPrebidResponse({
            ad: 'ad',
            adId: '123',
            mediaType: 'video'
          });
          expectEventMessage({
            adId: '123',
            event: RENDER_FAILED,
            info: {
              reason: 'preventWritingOnMainDocument'
            }
          })
        });

        it('on ads that have no markup or adUrl', () => {
          mockPrebidResponse({
            adId: '123',
          })
          expectEventMessage({
            adId: '123',
            event: RENDER_FAILED,
            info: {
              reason: 'noAd'
            }
          });
        });

        it('on exceptions', () => {
          iframeStub.callsFake(() => {
            throw new Error()
          });
          mockPrebidResponse({
            adId: '123',
            ad: 'ad',
            adUrl: ORIGIN,
          });
          expectEventMessage({
            adId: '123',
            event: RENDER_FAILED,
            info: {
              reason: 'exception'
            }
          });
        })
      });
      describe('should post AD_RENDER_SUCCEEDED', () => {
        it('on ad with markup', () => {
          mockPrebidResponse({
            adId: '123',
            ad: 'markup'
          });
          expectEventMessage({
            adId: '123',
            event: RENDER_SUCCESS
          });
        });
        it('on ad with adUrl', () => {
          mockPrebidResponse({
            adId: '123',
            adUrl: 'url'
          });
          expectEventMessage({
            adId: '123',
            event: RENDER_SUCCESS
          });
        })
      })
    });
  });

  describe('legacy creative', function() {
    it('should render legacy creative', function() {
      const mockWin = merge(mocks.createFakeWindow('http://example.com'), renderingMocks().getWindowObject());
      let ucTagData = {
        adId: '123'
      };

      renderLegacy(mockWin.document, ucTagData.adId);
      expect(mockWin.parent.$$PREBID_GLOBAL$$.renderAd.callCount).to.equal(1);
    });
  });
});
