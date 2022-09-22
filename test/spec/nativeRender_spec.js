import '../../src/nativeRender';

describe('nativeRender', () => {

    after(() => {
        delete window.ucTag;
    })

    it('should accept 2 arguments', () => {
        expect(window.ucTag.renderAd).to.exist;
        //expect exactly two arguments by this function
        expect(window.ucTag.renderAd.length).to.equal(2);
        
        // this function with two arguments and see it NOT throwing
        const renderAd = window.ucTag.renderAd.bind(this, document, {
            pubUrl: 'http://prebidjs.com',
            adId: 'abc123',
            replaceAllAssets: true
        })
        expect(renderAd).to.not.throw();
        
    })
})