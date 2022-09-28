import '../../src/legacyNativeRender';

describe('legacyNativeRender', () => {

    after(() => {
        delete window.pbNativeTag;
        window.nativeRenderManager.renderNativeAd.reset();
    })
    it('should accept only one argument', () => {
        
        expect(window.pbNativeTag.renderNativeAd).to.exist;
        //expect exactly one argument by this function
        expect(window.pbNativeTag.renderNativeAd.length).to.equal(1);
        
        const args = {
            pubUrl: 'http://prebidjs.com',
            adId: 'abc123'
        };
        window.nativeRenderManager.renderNativeAd = sinon.stub();

        window.pbNativeTag.renderNativeAd(args);
        expect(nativeRenderManager.renderNativeAd.calledOnceWith(document, args)).to.be.true;
        
    })
})
