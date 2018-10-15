const assert = require('assert');

describe('mobile app', function() {
  it('should load the creative', function() {
    browser
      .url('https://test.localhost:9990/testpages/mobile-app_test.html')
      .pause(4000);

    assert.equal(browser.isVisible('body > div > div > a > img'), true);
  }, 2);
})