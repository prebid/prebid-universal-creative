import { newNativeTrackerManager } from 'src/nativeTrackerManager';
import { expect } from 'chai';
import { mocks } from 'test/helpers/mocks';
import { merge } from 'lodash';

const renderingMocks = {
  messages: [],
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
  console.log((/:\d+/).test(url));
  return ((/:\d+/).test(url)) ? url.substring(0, url.lastIndexOf(':')) : url;
}

describe('nativeTrackerManager', function () {
  describe('load startTrackers', function () {
    let mockWin;
    let consoleWarn;
    
    let tagData = {
      pubUrl: 'http://example.com'
    };

    beforeEach(function () {
      mockWin = merge(mocks.createFakeWindow(tagData.pubUrl), renderingMocks.getWindowObject());
      consoleWarn = sinon.stub(console, 'warn');
    });

    afterEach(function () {
      consoleWarn.restore();
    });

    it('should verify the postMessage for impression trackers was executed', function() {
      mockWin.document.getElementsByClassName = () => [{
        attributes: {
          pbAdId: {
            value: 'ad123'
          }
        },
        addEventListener: (type, listener, capture) => {
        },
      }];

      let nativeTracker = new newNativeTrackerManager(mockWin);
      nativeTracker.startTrackers(tagData);

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
            target: {
              attributes: {
                pbAdId: {
                  value: 'ad123'
                }
              }
            }
          })
        })
      }];

      let nativeTracker = new newNativeTrackerManager(mockWin);
      nativeTracker.startTrackers(tagData);

      expect(mockWin.parent.postMessage.callCount).to.equal(2);

      let postMessageTargetDomain = mockWin.parent.postMessage.args[0][1];
      let postMessageContents = mockWin.parent.postMessage.args[0][0];
      let rawPostMessage = JSON.parse(postMessageContents);

      expect(rawPostMessage.message).to.exist.and.to.equal("Prebid Native");
      expect(rawPostMessage.adId).to.exist.and.to.equal("ad123");
      expect(rawPostMessage.action).to.exist.and.to.equal('click');
      expect(trimPort(postMessageTargetDomain)).to.equal(tagData.pubUrl);
    });

    it('should verify the warning message was executed', function() { 
      mockWin.document.getElementsByClassName = () => [{
        addEventListener: ((type, listener, capture) => {
        })
      }];

      let nativeTracker = new newNativeTrackerManager(mockWin);
      nativeTracker.startTrackers(tagData);

      expect(consoleWarn.callCount).to.equal(1);
    });
  });
});