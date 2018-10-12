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

  it('should ignore keys set to empty strings', function () {
    let ucTagData = {
      targetingMap: {
        hb_adid: ['123abc'],
        hb_format: ['banner'],
        hb_size: ['300x250']
      },
      adServerDomain: '',
      pubUrl: 'http://www.test.com',
      adId: ''
    };

    let auctionData = utils.transformAuctionTargetingData(ucTagData);
    expect(auctionData).to.deep.equal({
      adId: '123abc',
      mediaType: 'banner',
      size: '300x250',
      pubUrl: 'http://www.test.com'
    });
  });

  it('should preserve extra keys found in targetingMap and transform known keys', function () {
    let ucTagData = {
      targetingMap: {
        hb_adid: ['123abc'],
        hb_adid_appnexus: ['123abc'],
        hb_format: ['banner'],
        hb_size: ['300x250'],
        hb_bidder: ['appnexus']
      }
    };

    let auctionData = utils.transformAuctionTargetingData(ucTagData);
    expect(auctionData).to.deep.equal({
      adId: '123abc',
      hb_adid_appnexus: '123abc',
      mediaType: 'banner',
      size: '300x250',
      hb_bidder: 'appnexus'
    });
  });
});
