import { newNativeRenderManager } from 'src/nativeRenderManager';
import * as nam  from 'src/nativeAssetManager';
import { expect } from 'chai';
import { mocks } from 'test/helpers/mocks';
import { merge } from 'lodash';

const renderingMocks = {
  getWindowObject: function() {
    return {
      document: {},
      parent: {
        postMessage: sinon.spy()
      }
    }
  }
};

function trimPort(url) {
  return ((/:\d+/).test(url)) ? url.substring(0, url.lastIndexOf(':')) : url;
}

describe('nativeRenderManager', function () {
  describe('load renderNativeAd', function () {
    let mockWin;
    let consoleWarn;
    let assetManagerStub;

    before(function() {
      assetManagerStub = sinon.stub(nam, 'newNativeAssetManager').callsFake(() => {
        return {
          loadAssets: (adId, callback) => {
            callback();
          }
        }
      });
    });

    let tagData = {
      pubUrl: 'http://example.com',
      adId: 'ad123',
      assetsToReplace: ['image','hb_native_linkurl','body','title'],
    };

    beforeEach(function () {
      mockWin = merge(mocks.createFakeWindow(tagData.pubUrl), renderingMocks.getWindowObject());
      consoleWarn = sinon.stub(console, 'warn');
    });

    afterEach(function () {
      consoleWarn.restore();
      assetManagerStub.resetHistory();
    });

    after(function() {
      assetManagerStub.restore();
    });

    it("should verify the postMessage for impression trackers was executed", function () {
      mockWin.document.getElementsByClassName = () => [
        {
          attributes: {
            pbAdId: {
              value: "ad123",
            },
          },
          addEventListener: (type, listener, capture) => {},
        },
      ];
      let nativeTracker = new newNativeRenderManager(mockWin);
      nativeTracker.renderNativeAd(mockWin.document, tagData);

      expect(mockWin.parent.postMessage.callCount).to.equal(1);
      let postMessageTargetDomain = mockWin.parent.postMessage.args[0][1];
      let postMessageContents = mockWin.parent.postMessage.args[0][0];
      let rawPostMessage = JSON.parse(postMessageContents);

      expect(rawPostMessage.message).to.exist.and.to.equal("Prebid Native");
      expect(rawPostMessage.adId).to.exist.and.to.equal("ad123");
      expect(rawPostMessage.action).to.not.exist;
      expect(trimPort(postMessageTargetDomain)).to.equal(tagData.pubUrl);
    });

    it('should verify the postMessages for the impression and click trackers were executed', function() {
      mockWin.document.getElementsByClassName = () => [{
        attributes: {
          pbAdId: {
            value: 'ad123'
          }
        },
        addEventListener: ((type, listener, capture) => {
          listener({
          })
        })
      }];

      let nativeTracker = new newNativeRenderManager(mockWin);
      nativeTracker.renderNativeAd(mockWin.document, tagData);

      expect(mockWin.parent.postMessage.callCount).to.equal(2);

      let postMessageTargetDomain = mockWin.parent.postMessage.args[0][1];
      let postMessageContents = mockWin.parent.postMessage.args[1][0];
      let rawPostMessage = JSON.parse(postMessageContents);

      expect(rawPostMessage.message).to.exist.and.to.equal("Prebid Native");
      expect(rawPostMessage.adId).to.exist.and.to.equal("ad123");
      expect(rawPostMessage.action).to.exist.and.to.equal('click');
      expect(trimPort(postMessageTargetDomain)).to.equal(tagData.pubUrl);
    });
  });
});
