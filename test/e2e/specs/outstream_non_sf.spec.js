const assert = require('assert');

describe('outstream', function() {
  it('should load outstream non-sf creative', function() {
    browser
      .url('http://test.localhost:9990/testpages/outstream_non-sf.html')
      .scroll(0, 300)
      .pause(6000);

    // outstream will create two iframes when loaded
    let iframes = browser.elements('div[id="div-gpt-ad-1536590534855-0"] > div:nth-child(2) > iframe')
    assert.equal(iframes.value.length, 2);
  }, 2);
});