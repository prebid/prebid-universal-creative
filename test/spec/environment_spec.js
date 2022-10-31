import { expect } from 'chai';
import * as env from 'src/environment';
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
    expect(env.isMobileApp).to.exist;
    expect(env.isCrossDomain).to.exist;
    expect(env.isSafeFrame).to.exist;
    expect(env.isAmp).to.exist;
  });

  it('should detect safeframe', function() {
    const mockWin = merge(mocks.createFakeWindow('http://appnexus.com'), envMocks.getWindowObject());
    expect(env.isSafeFrame(mockWin)).to.equal(true);
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
    expect(env.isAmp('some-uuid', mockWin)).to.equal(true);
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
    expect(env.canLocatePrebid(mockWin)).to.equal(true);
	});
  
  it('should detect mobile app', function() {
    expect(env.isMobileApp('mobile-app')).to.equal(true);
  });
});


