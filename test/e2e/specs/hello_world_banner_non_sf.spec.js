const expect = require('chai').expect;
const { waitForElement, switchFrame } = require('../../helpers/testing-utils');

describe('banner', function () {
  this.retries(3);
  const creativeIframeSelector = 'iframe[id="google_ads_iframe_/19968336/puc_test_banner_nonsf_0"]';
  before(function loadTestPage() {
    browser.url('http://test.localhost:9990/testpages/hello_world_banner_non-sf.html');
    browser.pause(4000);
    try {
      waitForElement(creativeIframeSelector, 3000);
    } catch (e) {
      // If creative Iframe didn't load, repeat the steps again!
      // Due to some reason if the Ad server doesn't respond, the test case will time out after 60000 ms as defined in file wdio.conf.js
      loadTestPage();
    }
  });
  it('should load the creative', function () {
    switchFrame(creativeIframeSelector);
    const ele = $('body > div[class="GoogleActiveViewElement"] > a > img');
    expect(ele.isExisting()).to.be.true;
  });
})