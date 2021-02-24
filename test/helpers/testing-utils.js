module.exports = {
    waitForElement: function(elementRef, time = 2000) {
      let element = $(elementRef);
      element.waitForExist({timeout: time});
    },
    switchFrame: function(frameRef, frameName) {
      let iframe = $(frameRef);
      browser.switchToFrame(iframe);
    }
  }