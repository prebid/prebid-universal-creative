import { expect } from 'chai';
import * as utils from 'src/utils';

describe('utils', function() {
  it('should transform non dfp arguments', function() {
    let ucTagData = {
      cacheHost: 'example.com',
      cachePath: '/path',
      uuid: '123',
      size: '300x250'
    };
    let auctionData = utils.transformAuctionTargetingData(ucTagData);
    expect(auctionData).to.deep.equal({
      cacheHost: 'example.com',
      cachePath: '/path',
      uuid: '123',
      size: '300x250'
    });
  });

  it('should transform targeting map', function() {
    let ucTagData = {
      targetingMap: {
        hb_adid: ['123'],
        hb_cache_host: ['example.com'],
        hb_cache_path: ['/path'],
        hb_cache_id: ['123'],
        hb_size: ['300x250'],
        hb_format: ['banner'],
        hb_env: ['mobile-app']
      }
    };
    let auctionData = utils.transformAuctionTargetingData(ucTagData);
    expect(auctionData).to.deep.equal({
      adId: '123', 
      cacheHost: 'example.com', 
      cachePath: '/path', 
      uuid: '123', 
      size: '300x250', 
      mediaType: 'banner', 
      env: 'mobile-app'
    });
  });
});
