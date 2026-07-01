import { renderAmpOrMobileAd } from 'src/mobileAndAmpRender';
import * as postscribeRender from 'src/postscribeRender'
import * as utils from 'src/utils';
import { expect } from 'chai';
import { writeAdHtml } from 'src/postscribeRender';


describe("renderingManager", function () {
  describe("mobile creative", function () {
    let sandbox;
    let writeHtmlSpy;
    let sendRequestStub;
    let requestCallbacks;

    beforeEach(function () {
      sandbox = sinon.createSandbox();
      requestCallbacks = [];
      writeHtmlSpy = sandbox.spy(postscribeRender, "writeAdHtml");
      sendRequestStub = sandbox.stub(utils, "sendRequest").callsFake((url, callback) => {
        requestCallbacks.push(callback);
      });
      sandbox.spy(utils, "triggerPixel");
    });

    afterEach(function () {
      sandbox.restore();
    });

    it("should render mobile app creative", function () {
      let ucTagData = {
        cacheHost: "example.com",
        cachePath: "/path",
        uuid: "123",
        size: "300x250",
      };

      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup",
        wurl: "https://test.prebidcache.wurl",
      };
      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestStub.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
    });

    it("should render mobile app creative with missing cache wurl", function () {
      let ucTagData = {
        cacheHost: "example.com",
        cachePath: "/path",
        uuid: "123",
        size: "300x250",
      };

      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup",
      };
      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestStub.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
    });

    it("should render mobile app creative using default cacheHost and cachePath", function () {
      let ucTagData = {
        uuid: "123",
        size: "300x250",
      };
      renderAmpOrMobileAd(ucTagData, true);

      let response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup",
      };
      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.callCount).to.equal(1);
      expect(sendRequestStub.args[0][0]).to.equal(
        "https://prebid.adnxs.com/pbc/v1/cache?uuid=123"
      );
    });

  //   it('should catch errors from creative', function (done) {
  //     window.addEventListener('error', e => {
  //       done(e.error);
  //     });

  //     const consoleErrorSpy = sinon.spy(console, 'error');

  //     let ucTagData = {
  //       cacheHost: 'example.com',
  //       cachePath: '/path',
  //       uuid: '123',
  //       size: '300x250'
  //     };

  //     renderAmpOrMobileAd(ucTagData, true);

  //     let response = {
  //       width: 300,
  //       height: 250,
  //       crid: 123,
  //       adm: '<script src="notExistingScript.js"></script>'
  //     };
  //     requestCallbacks[0](JSON.stringify(response));

  //     setTimeout(() => {
  //       expect(consoleErrorSpy.callCount).to.equal(1);
  //       done();
  //     }, 10);
  //   });
  });

  describe("amp creative", function () {
    let sandbox;
    let writeHtmlSpy;
    let sendRequestSpy;
    let triggerPixelSpy;
    let ucTagData;
    let response;
    let requestCallbacks;

    beforeEach(function () {
      sandbox = sinon.createSandbox();
      requestCallbacks = [];
      writeHtmlSpy = sandbox.spy(postscribeRender, "writeAdHtml");
      sendRequestSpy = sandbox.stub(utils, "sendRequest").callsFake((url, callback) => {
        requestCallbacks.push(callback);
      });
      triggerPixelSpy = sandbox.spy(utils, "triggerPixel");
      ucTagData = {
        cacheHost: "example.com",
        cachePath: "/path",
        uuid: "123",
        size: "300x250",
      };
      response = {
        width: 300,
        height: 250,
        crid: 123,
        adm: "ad-markup${AUCTION_PRICE}",
        wurl: "https://test.prebidcache.wurl",
      };
    });



    afterEach(function () {
      sandbox.restore();
    });

    it('should send embed-resize message', () => {
      sandbox.spy(window.parent, 'postMessage');
      ucTagData.size = '400x500'
      renderAmpOrMobileAd(ucTagData);
      requestCallbacks[0](JSON.stringify(response));
      sinon.assert.calledWith(window.parent.postMessage, {
        sentinel: "amp",
        type: "embed-size",
        width: 400,
        height: 500,
      });
    });

    it("should render amp creative", function () {
      ucTagData.hbPb = "10.00";
      renderAmpOrMobileAd(ucTagData);


      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal(
        "<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup10.00"
      );
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
      expect(triggerPixelSpy.args[0][0]).to.equal(
        "https://test.prebidcache.wurl"
      );
    });

    it("should replace AUCTION_PRICE with response.price over hbPb", function () {
      renderAmpOrMobileAd(ucTagData);
      response.price = 12.5;
      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal(
        "<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup12.5"
      );
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
      expect(triggerPixelSpy.args[0][0]).to.equal(
        "https://test.prebidcache.wurl"
      );
    });

    it("should replace AUCTION_PRICE with with empty value when neither price nor hbPb exist", function () {
      renderAmpOrMobileAd(ucTagData);
      requestCallbacks[0](JSON.stringify(response));
      expect(writeHtmlSpy.args[0][0]).to.equal(
        "<!--Creative 123 served by Prebid.js Header Bidding-->ad-markup"
      );
      expect(sendRequestSpy.args[0][0]).to.equal(
        "https://example.com/path?uuid=123"
      );
      expect(triggerPixelSpy.args[0][0]).to.equal(
        "https://test.prebidcache.wurl"
      );
    });
  });
});

describe('writeAdHtml', () => {

  afterEach(() => {
    window.testScriptExecuted = undefined;
  });

  it('removes DOCTYPE from markup', () => {
    const ps = sinon.stub();
    writeAdHtml('<!DOCTYPE html><div>mock-ad</div>', ps);
    sinon.assert.calledWith(ps, sinon.match.any, '<div>mock-ad</div>')
  });

  it('removes lowercase doctype from markup', () => {
    const ps = sinon.stub();
    writeAdHtml('<!doctype html><div>mock-ad</div>', ps);
    sinon.assert.calledWith(ps, sinon.match.any, '<div>mock-ad</div>')
  });

  it('removes XML declarations from markup', () => {
    const ps = sinon.stub();
    writeAdHtml('<?xml version="1.0" encoding="UTF-8"?><div>mock-ad</div>', ps);
    sinon.assert.calledWith(ps, sinon.match.any, '<div>mock-ad</div>')
  });

  it('removes malformed XML declarations from markup', () => {
    const ps = sinon.stub();
    writeAdHtml('<?xml version="1.0"><div>mock-ad</div>', ps);
    sinon.assert.calledWith(ps, sinon.match.any, '<div>mock-ad</div>')
  });

  it('removes doctype declarations with internal subsets from markup', () => {
    const ps = sinon.stub();
    writeAdHtml('<!DOCTYPE html [<!ENTITY nbsp "&#160;">]><div>mock-ad</div>', ps);
    sinon.assert.calledWith(ps, sinon.match.any, '<div>mock-ad</div>')
  });

  it('should execute script tag inserted into the body', () => {
    const markup = '<script>window.testScriptExecuted=true;</script>'
    writeAdHtml(markup);
    expect(window.testScriptExecuted).to.equal(true);
  });

  it('should handle single quotes with inner double quotes', () => {
    const input = `<img title='uh "oh" > this should all be inside the title attribute'>`;
    console.log('Input: ', input);

    writeAdHtml(input);

    const img = document.querySelector('img:last-of-type');
    if (img) {
      console.log('Output:', img.outerHTML);
      console.log('Title: ', img.getAttribute('title'));

      const expected = 'uh "oh" > this should all be inside the title attribute';
      expect(img.getAttribute('title')).to.equal(expected);
    }
  });

  it('should handle JSON in data attributes with single quotes', () => {
    const input = `<div data-json='{"key": "value"}'>Test</div>`;
    console.log('Input: ', input);

    writeAdHtml(input);

    const div = document.querySelector('div[data-json]:last-of-type');
    if (div) {
      console.log('Output:', div.outerHTML);
      console.log('Data:  ', div.getAttribute('data-json'));

      const dataJson = div.getAttribute('data-json');
      expect(dataJson).to.equal('{"key": "value"}');

      const parsed = JSON.parse(dataJson);
      expect(parsed.key).to.equal('value');
    }
  });
})
