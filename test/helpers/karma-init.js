(function (window) {
  if (!window.parent.initDone && window.location.pathname === '/context.html') {
       window.parent.initDone = true;
       window.open('/debug.html', '_blank');
  }
})(window)