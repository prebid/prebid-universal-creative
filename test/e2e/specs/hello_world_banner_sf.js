var assert = require('assert');

describe('banner', function() {
    it('should load the creative', function() {
				browser.url('https://test.localhost:9990/testpages/hello_world_banner_sf.html');
				browser.pause(4000);
				browser.waitForExist('iframe[id="google_ads_iframe_/19968336/puc_monitor_banner_0"]');
				var my_frame = $('iframe[id="google_ads_iframe_/19968336/puc_monitor_banner_0"]').value;
				browser.frame(my_frame);
				assert.equal(browser.isVisible('body > a > img'), true);
		});
})