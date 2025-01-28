import { renderCrossDomain, renderLegacy } from 'src/renderingManager';
import * as utils from 'src/utils';
import * as domHelper from 'src/domHelper';
import * as dynamic from 'src/dynamicRenderer.js';
import { expect } from 'chai';
import { mocks } from 'test/helpers/mocks';
import { merge } from 'lodash';
import {MIN_RENDERER_VERSION} from "src/dynamicRenderer.js";

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

  describe('cross domain creative', function() {
    const ORIGIN = 'http://example.com';
    let sandbox;
    let parseStub;
    let iframeStub;
    let triggerPixelSpy;
    let mockWin;
    let ucTagData;
    let mockIframe;
    let eventSource;

    beforeEach(function(){
      sandbox = sinon.createSandbox();
      mockIframe = createMockIframe();
      parseStub = sandbox.stub(utils, 'parseUrl');
      iframeStub = sandbox.stub(domHelper, 'getEmptyIframe').returns(mockIframe);
      triggerPixelSpy = sandbox.stub(utils, 'triggerPixel');
      parseStub.returns({
        protocol: 'http',
        host: 'example.com'
      });
      mockWin = merge(mocks.createFakeWindow(ORIGIN), renderingMocks().getWindowObject());
      ucTagData = {
        adId: '123',
        adServerDomain: 'mypub.com',
        pubUrl: ORIGIN,
      };
      eventSource = null;

      renderCrossDomain(mockWin, ucTagData.adId, ucTagData.adServerDomain, ucTagData.pubUrl);

    });

    afterEach(function () {
      sandbox.restore();
    });

    function mockPrebidResponse(msg)  {
      mockWin.postMessage({
        origin: ORIGIN,
        message: JSON.stringify(Object.assign({ message: 'Prebid Response' }, msg))
      });
    }

    it('should run renderer if present', () => {
      sandbox.stub(dynamic, 'runDynamicRenderer');
      const data = {
        adId: '123',
        renderer: 'mock-renderer',
        rendererVersion: MIN_RENDERER_VERSION,
        ad: 'markup'
      };
      mockPrebidResponse(data);
      sinon.assert.calledWith(dynamic.runDynamicRenderer, data.adId, sinon.match(data))
    })

    it("should render cross domain creative", function () {
      mockPrebidResponse({
        ad: "ad",
        adUrl: ORIGIN,
        adId: "123",
        width: 300,
        height: 250,
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
          });
        });

        it('on ads that have no markup or adUrl', () => {
          mockPrebidResponse({
            adId: '123',
          });
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
            throw new Error();
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
        });
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
      window.parent = mockWin;

      renderLegacy(mockWin.document, ucTagData.adId);
      expect(mockWin.parent.$$PREBID_GLOBAL$$.renderAd.callCount).to.equal(1);
    });
  });
});
