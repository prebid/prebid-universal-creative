import {newNativeRenderManager} from 'src/nativeRenderManager';
import * as nam from 'src/nativeAssetManager';
import {mocks} from 'test/helpers/mocks';
import {merge} from 'lodash';

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

    describe('should fire event', () => {
      let recvMessages;
      function mockMessenger() {
        return recvMessages.push.bind(recvMessages);
      }

      beforeEach(() => {
        recvMessages = [];
      });
      it('AD_RENDER_SUCCEEDED', () => {
        const mockAssetMgr = function () {
          return {
            loadAssets(_, fn) {
              fn();
            }
          }
        }
        const rdr = newNativeRenderManager(mockWin, mockMessenger, mockAssetMgr);
        rdr.renderNativeAd(mockWin.document, tagData);
        sinon.assert.match(recvMessages[0], {
          message: 'Prebid Event',
          adId: 'ad123',
          event: 'adRenderSucceeded',
        })
      })
      describe('AD_RENDER_FAILED', () => {
        it('on exceptions', () => {
          const rdr = newNativeRenderManager(mockWin, mockMessenger);
          rdr.renderNativeAd(mockWin.document, Object.defineProperties({...tagData}, {
            rendererUrl: {
              get() {
                throw new Error('err');
              }
            }
          }));
          sinon.assert.match(recvMessages[0], {
            message: 'Prebid Event',
            adId: 'ad123',
            event: 'adRenderFailed',
            info: {
              reason: 'exception',
              message: 'err'
            }
          })
        });
        it('on missing adId',() => {
          const rdr = newNativeRenderManager(mockWin, mockMessenger);
          rdr.renderNativeAd(mockWin.document, {...tagData, adId: undefined});
          sinon.assert.match(recvMessages[0], {
            message: 'Prebid Event',
            event: 'adRenderFailed',
            info: {
              reason: 'missingDocOrAdid',
            }
          })
        });
        it('on rendering errors', () => {
          const mockAssetMgr = function () {
            return {
              loadAssets(_1, _2, err) {
                err(new Error('err'))
              }
            }
          }
          const rdr = newNativeRenderManager(mockWin, mockMessenger, mockAssetMgr);
          rdr.renderNativeAd(mockWin.document, tagData);
          sinon.assert.match(recvMessages[0], {
            message: 'Prebid Event',
            event: 'adRenderFailed',
            info: {
              reason: 'exception',
              message: 'err'
            }
          })
        })
      })
    });
  });

});
