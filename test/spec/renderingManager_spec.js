import { newRenderingManager } from 'src/renderingManager';
import * as utils from 'src/utils';
import * as domHelper from 'src/domHelper';
import { expect } from 'chai';
import { mocks } from 'test/helpers/mocks';
import { merge } from 'lodash';

const renderingMocks = {
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

let mockIframe = {
  contentDocument: {
    open: sinon.spy(),
    write: sinon.spy(),
    close: sinon.spy()
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
    let mockWin;

    before(function() {
      writeHtmlSpy = sinon.spy(utils, 'writeAdHtml');
      sendRequestSpy = sinon.spy(utils, 'sendRequest');
      mockWin = merge(mocks.createFakeWindow('http://example.com'), renderingMocks.getWindowObject());
    });
    
    afterEach(function() {
      writeHtmlSpy.resetHistory();
      sendRequestSpy.resetHistory();
    });

    after(function() {
      writeHtmlSpy.restore();
      sendRequestSpy.restore();
    });

    const env = {
      isMobileApp: () => true,
      isSafeFrame: () => false
    }
    
    it('should render mobile app creative', function() {
      const renderObject = newRenderingManager(mockWin, env);
      let ucTagData = {
        cacheHost: 'example.com',
        cachePath: '/path',
        uuid: '123',
        size: '300x250'
      };
      
      renderObject.renderAd(mockWin.document, ucTagData);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: 'ad-markup'
      }
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestSpy.args[0][0]).to.equal('https://example.com/path?uuid=123');
    });

    it('should render mobile app creative using default cacheHost and cachePath', function() {
      const renderObject = newRenderingManager(mockWin, env);
      let ucTagData = {
        uuid: '123',
        size: '300x250'
      };
      
      renderObject.renderAd(mockWin.document, ucTagData);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: 'ad-markup'
      }
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestSpy.args[0][0]).to.equal('https://prebid.adnxs.com/pbc/v1/cache?uuid=123');
    });
  });

  describe('amp creative', function() {
    let writeHtmlSpy;
    let sendRequestSpy;
    let mockWin;

    before(function() {
      writeHtmlSpy = sinon.spy(utils, 'writeAdHtml');
      sendRequestSpy = sinon.spy(utils, 'sendRequest');
      mockWin = merge(mocks.createFakeWindow('http://example.com'), renderingMocks.getWindowObject());
    });
    
    afterEach(function() {
      writeHtmlSpy.resetHistory();
      sendRequestSpy.resetHistory();
    });

    after(function() {
      writeHtmlSpy.restore();
      sendRequestSpy.restore();
    });

    const env = {
      isMobileApp: () => false,
      isAmp: () => true,
      isSafeFrame: () => true
    }
    
    it('should render amp creative', function() {
      const renderObject = newRenderingManager(mockWin, env);

      let ucTagData = {
        cacheHost: 'example.com',
        cachePath: '/path',
        uuid: '123',
        size: '300x250'
      };
        
      renderObject.renderAd(mockWin.document, ucTagData);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: 'ad-markup'
      }
      requests[0].respond(200, {}, JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal('<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup');
      expect(sendRequestSpy.args[0][0]).to.equal('https://example.com/path?uuid=123');
    });
  });
  
  describe('cross domain creative', function() {
    let parseStub;
    let iframeStub;
    beforeEach(function(){
      parseStub = sinon.stub(utils, 'parseUrl');
      iframeStub = sinon.stub(domHelper, 'getEmptyIframe');
    });

    after(function() {
      parseStub.restore();
      iframeStub.restore();
    });

    it('should render cross domain creative', function() {
      parseStub.returns({
        protocol: 'http',
        host: 'example.com'
      });
      iframeStub.returns(mockIframe);

      const mockWin = merge(mocks.createFakeWindow('http://example.com'), renderingMocks.getWindowObject());
      const env = {
        isMobileApp: () => false,
        isAmp: () => false,
        isCrossDomain: () => true
      }
      const renderObject = newRenderingManager(mockWin, env);
      let ucTagData = {
        adId: '123',
        adServerDomain: 'mypub.com',
        pubUrl: 'http://example.com',
      };

      renderObject.renderAd(mockWin.document, ucTagData);

      // dummy implementation of postmessage from prebid.js
      let ev = {
        origin: 'http://example.com',
        message: JSON.stringify({
          message: 'Prebid Response',
          ad: 'ad',
          adUrl: 'http://example.com',
          adId: '123',
          width: 300,
          height: 250
        })
      }
      
      mockWin.postMessage(ev);
      expect(mockIframe.contentDocument.write.args[0][0]).to.equal("ad");
    });
  });

  describe('legacy creative', function() {
    it('should render legacy creative', function() {
      const mockWin = merge(mocks.createFakeWindow('http://example.com'), renderingMocks.getWindowObject());
      const env = {
        isMobileApp: () => false,
        isAmp: () => false,
        isCrossDomain: () => false
      }
      const renderObject = newRenderingManager(mockWin, env);

      let ucTagData = {
        adId: '123'
      };
        
      renderObject.renderAd(mockWin.document, ucTagData);
      expect(mockWin.parent.$$PREBID_GLOBAL$$.renderAd.callCount).to.equal(1);
    });
  });
});