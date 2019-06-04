import { expect } from 'chai';
import * as utils from 'src/utils';

describe('utils', function () {
  describe('transformAuctionTargetingData', function () {
    it('should transform non dfp arguments', function () {
      let ucTagData = {
        cacheHost: 'example.com',
        cachePath: '/path',
        uuid: '123',
        size: '300x250',
        hbPb: '10.00'
      };
      let auctionData = utils.transformAuctionTargetingData(ucTagData);
      expect(auctionData).to.deep.equal({
        cacheHost: 'example.com',
        cachePath: '/path',
        uuid: '123',
        size: '300x250',
        hbPb: '10.00'
      });
    });

    it('should transform targeting map', function () {
      let ucTagData = {
        targetingMap: {
          hb_adid: ['123'],
          hb_cache_host: ['example.com'],
          hb_cache_path: ['/path'],
          hb_cache_id: ['123'],
          hb_size: ['300x250'],
          hb_format: ['banner'],
          hb_env: ['mobile-app'],
          hb_pb: ['10.00']
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
        env: 'mobile-app',
        hbPb: '10.00'
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

    it('should transform data from targetingKeywords param properly', function() {
      let ucTagData = {
        targetingKeywords: "hb_adid:123abc,hb_adid_appnexus:123abc,hb_format:banner,hb_size:300x250,hb_bidder:appnexus,test"
      };
      let auctionData = utils.transformAuctionTargetingData(ucTagData);
      expect(auctionData).to.deep.equal({
        adId: '123abc',
        hb_adid_appnexus: '123abc',
        mediaType: 'banner',
        size: '300x250',
        hb_bidder: 'appnexus'
      });

      ucTagData = {
        targetingKeywords: '',
        pubUrl: 'http://www.test.com'
      };
      auctionData = utils.transformAuctionTargetingData(ucTagData);
      expect(auctionData).to.deep.equal({
        pubUrl: 'http://www.test.com'
      })
    });
  });

  describe('parseUrl', function() {
    it('should properly parse an encoded url', function() {
      let encUrl = 'http%3A%2F%2Fjsnellbaker.devnxs.net%2Fast_uc_sf_test.html%3Fpbjs_debug%3Dtrue%26ast_debug%3Dtrue';
      
      let result = utils.parseUrl(encUrl);
      
      expect(result).to.be.an('object');
      expect(result.href).to.exist.and.to.equal('http://jsnellbaker.devnxs.net/ast_uc_sf_test.html?pbjs_debug=true&ast_debug=true');
      expect(result.protocol).to.exist.and.to.equal('http');
      expect(result.hostname).to.exist.and.to.equal('jsnellbaker.devnxs.net');
      expect(result.port).to.exist.and.that.is.oneOf([0, 80]);
      expect(result.pathname).to.exist.and.to.equal('/ast_uc_sf_test.html');
      expect(result.hash).to.exist.and.to.equal('');
      expect(result.host).to.exist.and.that.is.oneOf(['jsnellbaker.devnxs.net','jsnellbaker.devnxs.net:80']);
    });
  });
});
