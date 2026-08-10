export function createMraid2Mock({isReady, isViewable}) {
  let _isReady = isReady || false;
  let _isViewable = isViewable || false;

  // Simple in that we only support 1 callback per event for test mocking purposes.
  let _simpleCallbacks = {};

  window.MRAID_ENV = {
    version: 2
  };

  window.mraid = {
    getState: () => _isReady ? 'ready': 'loading',
    isViewable: () => _isViewable,
    addEventListener: (eventName, callback) => {
      _simpleCallbacks[eventName] = callback;
    },
    removeEventListener: (eventName) => {
      if (_simpleCallbacks[eventName]) {
        delete _simpleCallbacks[eventName];
      }
    }
  };

  return {
    setReady(isReady) {
      _isReady = isReady;
      if (_simpleCallbacks.ready) {
        _simpleCallbacks.ready();
      }
    },
    setViewable(isViewable) {
      _isViewable = isViewable;
      if (_simpleCallbacks.viewableChange) {
        _simpleCallbacks.viewableChange(_isViewable);
      }
    },
    cleanup() {
      delete window.mraid;
      delete window.MRAID_ENV;
    }
  }
}

export function createMraid3Mock({isReady, isViewable}) {
  let _isReady = isReady || false;
  let _isViewable = isViewable || false;

  // Simple in that we only support 1 callback per event for test mocking purposes.
  let _simpleCallbacks = {};

  window.MRAID_ENV = {
    version: 3
  };

  window.mraid = {
    getState: () => _isReady ? 'ready': 'loading',
    isViewable: () => _isViewable,
    addEventListener: (eventName, callback) => {
      _simpleCallbacks[eventName] = callback;

      if (eventName === 'exposureChange') {
        _simpleCallbacks.exposureChange(_isViewable ? 1 : 0);
      }
    },
    removeEventListener: (eventName) => {
      if (_simpleCallbacks[eventName]) {
        delete _simpleCallbacks[eventName];
      }
    }
  };

  return {
    setReady(isReady) {
      _isReady = isReady;
      if (_simpleCallbacks.ready) {
        _simpleCallbacks.ready();
      }
    },
    setViewable(isViewable) {
      _isViewable = isViewable;
      if (_simpleCallbacks.exposureChange) {
        _simpleCallbacks.exposureChange(_isViewable ? 1 : 0);
      }
    },
    cleanup() {
      delete window.mraid;
      delete window.MRAID_ENV;
    }
  }
}
