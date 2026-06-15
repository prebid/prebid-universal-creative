import { getBuyerUids, loadData } from 'src/ssp-userids/uid';
import * as commons from 'src/ssp-userids/commons';
import { expect } from 'chai';

describe('uid module', function() {
  let sandbox;
  let saveStorageStub;
  let getStorageStub;
  let ajaxStub;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
    saveStorageStub = sandbox.stub(commons, 'setDataInLocalStorage');
    getStorageStub = sandbox.stub(commons, 'getDataFromLocalStorage');
    ajaxStub = sandbox.stub(commons, 'ajax');
  });

  afterEach(function() {
    sandbox.restore();
  });

  it('should save data in local storage when script is loaded', function() {
    getStorageStub.returns(null);
    let response = '{"buyeruids": {"appnexus":"12345"}}';
    loadData(sinon.spy());
    ajaxStub.firstCall.args[1](response);
    expect(JSON.parse(saveStorageStub.args[0][1])).to.have.all.keys(['buyeruids', 'lastUpdated'])
    expect(saveStorageStub.callCount).to.equal(1);
  });

  it('should get buyer ids from local storage', function() {
    let response = '{"buyeruids": {"appnexus":"12345"},"lastUpdated":"123456"}';
    getStorageStub.returns(response);
    let callbackSpy = sinon.spy();
    getBuyerUids(callbackSpy);
    let expectedResponse = {
      "buyeruids": {"appnexus":"12345"}
    }
    expect(callbackSpy.calledWith(null, expectedResponse)).to.be.true;
    expect(ajaxStub.callCount).to.equal(0);
  });

  it('should get buyer ids from endpoint when local storage not supported', function() {
    let response = '{"buyeruids": {"appnexus":"12345"}}';
    getStorageStub.returns(undefined);
    let callbackSpy = sinon.spy();
    getBuyerUids(callbackSpy);
    ajaxStub.firstCall.args[1](response);
    expect(callbackSpy.calledWith(null, JSON.parse(response))).to.be.true;
    expect(saveStorageStub.callCount).to.equal(1);
  });
});