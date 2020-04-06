const assert = require('assert');

describe('banner', function() {
  it('should load the creative', function() {
    browser
      .url('http://test.localhost:9990/testpages/hello_world_banner_non-sf.html')
      .pause(4000);

    browser.waitForExist('iframe[id="google_ads_iframe_/19968336/puc_test_banner_nonsf_0"]');
    let creativeIframe = $('iframe[id="google_ads_iframe_/19968336/puc_test_banner_nonsf_0"]').value;
    browser.frame(creativeIframe);
    assert.equal(browser.isVisible('body > div[class="GoogleActiveViewElement"] > a > img'), true);
  }, 2);
})