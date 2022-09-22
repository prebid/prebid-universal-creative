import '../../src/legacyNativeRender';

describe('legacyNativeRender', () => {

    after(() => {
        delete window.pbNativeTag;
    })
    it('should accept only one argument', () => {
        expect(window.pbNativeTag.renderNativeAd).to.exist;
        //expect exactly one argument by this function
        expect(window.pbNativeTag.renderNativeAd.length).to.equal(1);
        
        // try to call this function with two arguments and see it throw
        const renderNativeAdWithTwoArguments = window.pbNativeTag.renderNativeAd.bind(this, document, {
            pubUrl: 'http://prebidjs.com',
            adId: 'abc123'
        })
        expect(renderNativeAdWithTwoArguments).to.throw();
        
    })
})