import { fireNativeClickTrackers, fireNativeImpressionTrackers } from 'src/nativeORTBTrackerManager';
import * as utils from 'src/utils';

describe('test firing native trackers', function () {
  let triggerPixel;
  let loadScript;
  let getElementsByClassName;

  beforeEach(function () {
    triggerPixel = sinon.stub(utils, 'triggerPixel');
    loadScript = sinon.stub(utils, 'loadScript');

    getElementsByClassName = sinon.stub(document, 'getElementsByClassName').callsFake(() => {
      return [{
        addEventListener: (event, callback, capture) => {
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
  });


  it('should fire impression trackers', function () {
    let imgUrl = 'foo.bar/event?type=img';
    let jsUrl = 'foo.bar/event?type=js';
    let nativeOrtb = {
      eventtrackers: [
        { url: imgUrl, event: 1, method: 1 },
        { url: jsUrl, event: 1, method: 2 },
      ]
    }

    fireNativeImpressionTrackers(nativeOrtb);

    expect(triggerPixel.callCount).to.equal(1);
    expect(triggerPixel.args[0][0]).to.equal(imgUrl);
    expect(loadScript.callCount).to.equal(1);
    expect(loadScript.args[0][1]).to.equal(jsUrl);
  });

  it('should fire asset clicktrackers', function () {
    let assetTrackers = ['foo.bar/click?id=1', 'foo.bar/click?id=2'];
    let mainTrackers = ['foo.bar/click?id=3'];
    let nativeOrtb = {
      assets: [{
        id: 1,
        link: { clicktrackers: assetTrackers }
      }],
      link: {
        clicktrackers: mainTrackers
      }
    }

    fireNativeClickTrackers(nativeOrtb);
    expect(triggerPixel.callCount).to.equal(2);
    expect(triggerPixel.args[0][0]).to.equal(assetTrackers[0]);
    expect(triggerPixel.args[1][0]).to.equal(assetTrackers[1]);

    // change assetId to 2
    nativeOrtb.assets[0].id = 2;
    fireNativeClickTrackers(nativeOrtb);
    expect(triggerPixel.callCount).to.equal(3);
    expect(triggerPixel.args[2][0]).to.equal(mainTrackers[0]);
  });
});
