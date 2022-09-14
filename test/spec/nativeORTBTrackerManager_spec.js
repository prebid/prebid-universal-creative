import { addNativeClickTrackers, fireNativeImpressionTrackers } from 'src/nativeORTBTrackerManager';
import * as utils from 'src/utils';

describe('test firing native trackers', function () {
  let triggerPixel;
  let loadScript;
  let getElementsByClassName;
  let sendMessage;

  beforeEach(function () {
    triggerPixel = sinon.stub(utils, 'triggerPixel');
    loadScript = sinon.stub(utils, 'loadScript');
    sendMessage = sinon.spy();

    getElementsByClassName = sinon.stub(document, 'getElementsByClassName').callsFake(() => {
      return [{
        addEventListener: (event, callback, capture) => {
          // immediately call the callback to test the click
          callback({
            target: {
              getAttribute: (name) => {
                return 1;
              }
            }
          })
        }
      }]
    });
  });

  afterEach(function () {
    triggerPixel.restore();
    loadScript.restore();
    getElementsByClassName.restore();
    sendMessage.resetHistory();
  });


  it('should fire impression trackers', function () {
    let imgUrl = 'foo.bar/event?type=img';
    let jsUrl = 'foo.bar/event?type=js';
    

    fireNativeImpressionTrackers("abc123", sendMessage);

    expect(sendMessage.getCall(0).args[0]).to.deep.equal({
      message: 'Prebid Native', 
      action: 'fireNativeImpressionTrackers',
      adId: 'abc123'
    })
  });

  it('should fire asset clicktrackers', function () {
    let assetTrackers = ['foo.bar/click?id=1', 'foo.bar/click?id=2'];
    let mainTrackers = ['foo.bar/click?id=3'];
    let adId = "abc123";
    let nativeOrtb = {
      assets: [{
        id: 1,
        link: { clicktrackers: assetTrackers }
      }],
      link: {
        clicktrackers: mainTrackers
      }
    }

    addNativeClickTrackers(adId, nativeOrtb, sendMessage);
    expect(sendMessage.getCall(0).args[0]).to.deep.equal({
      message: "Prebid Native",
      action: 'click',
      adId: 'abc123',
      assetId: 1
    });
    
  });
});
