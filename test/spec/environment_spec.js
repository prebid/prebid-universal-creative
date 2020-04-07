import { expect } from 'chai';
import { newEnvironment } from 'src/environment';
import { mocks } from 'test/helpers/mocks';
import { merge } from 'lodash';

const envMocks = {
  getWindowObject: function() {
    return {
      $sf: {
        ext: {}
      }
    }
  }
}

describe('environment module', function() {
  
  it('should return env object with proper public api', function() {
    const mockWin = merge(mocks.createFakeWindow('http://appnexus.com'), envMocks.getWindowObject());
    const env = newEnvironment(mockWin);
    expect(env.isMobileApp).to.exist;
    expect(env.isCrossDomain).to.exist;
    expect(env.isSafeFrame).to.exist;
    expect(env.isAmp).to.exist;
  });

  it('should detect safeframe', function() {
    const mockWin = merge(mocks.createFakeWindow('http://appnexus.com'), envMocks.getWindowObject());
    const env = newEnvironment(mockWin);
    expect(env.isSafeFrame()).to.equal(true);
  });

  it('should detect amp', function() {
		let localWindow = {
			top: {
				location: {
					toString: () => { throw new Error('error')}
				}
			}
		}
    const mockWin = merge(mocks.createFakeWindow('http://appnexus.com'), envMocks.getWindowObject(), localWindow);
    const env = newEnvironment(mockWin);
    expect(env.isAmp('some-uuid')).to.equal(true);
	});
	
	it('should detect Prebid in higher window', function() {
    let localWindow = {
      parent: {
        parent: {
          pbjs: {
            fakeFn: () => {}
          }
        }
      }
    };
    const mockWin = merge(mocks.createFakeWindow('http://appnexus.com'), envMocks.getWindowObject(), localWindow);
    const env = newEnvironment(mockWin);
    expect(env.canLocatePrebid()).to.equal(true);
	});
  
  it('should detect mobile app', function() {
    const mockWin = merge(mocks.createFakeWindow('http://appnexus.com'), envMocks.getWindowObject());
    const env = newEnvironment(mockWin);
    expect(env.isMobileApp('mobile-app')).to.equal(true);
  });
});


