import {makeIframe} from '../../src/domHelper.js';
import {hasDynamicRenderer, MIN_RENDERER_VERSION, runDynamicRenderer} from '../../src/dynamicRenderer.js';
import {AD_RENDER_FAILED, AD_RENDER_SUCCEEDED, PREBID_EVENT} from '../../src/messaging.js';

describe('hasDynamicRenderer', () => {
    Object.entries({
        'neither': {},
        'renderer, but no version': {
            renderer: 'mock-renderer'
        },
        'renderer, but version is too low': {
            renderer: 'mock-renderer',
            rendererVersion: 1
        },
    }).forEach(([t, data]) => {
        it(`returns false with ${t}`, () => {
            expect(hasDynamicRenderer(data)).to.be.false;
        })
    });

    it('returns true when both renderer and version are present', () => {
        expect(hasDynamicRenderer({
            renderer: 'mock-renderer',
            rendererVersion: MIN_RENDERER_VERSION
        })).to.be.true;
    })
})

describe('runDynamicRenderer', () => {
    let sendMessage, frame, render;
    const adId = '123';
    beforeEach(() => {
        render = sinon.stub();
        sendMessage = sinon.stub();
        frame = makeIframe(document);
        return new Promise((resolve) => {
            frame.onload = resolve;
            document.body.appendChild(frame);
        }).then(() => {
            frame.contentWindow._render = render;
        });
    });

    afterEach(() => {
        document.body.removeChild(frame);
    });

    function runRenderer(data) {
        return runDynamicRenderer(adId, Object.assign({
            renderer: `window.render = window.parent._render`
        }, data), sendMessage, frame.contentWindow).catch(() => null);
    }

    it('runs renderer', () => {
        const data = {ad: 'markup'};
        return runRenderer(data).then(() => {
            sinon.assert.calledWith(render, sinon.match(data), sinon.match({mkFrame: makeIframe}), frame.contentWindow);
        });
    });

    Object.entries({
        'returns': null,
        'returns a promise that resolves': Promise.resolve()
    }).forEach(([t, ret]) => {
        it(`emits AD_RENDER_SUCCEDED when renderer ${t}`, () => {
            render.callsFake(() => ret);
            return runRenderer().then(() => {
                sinon.assert.calledWith(sendMessage, {
                    adId,
                    message: PREBID_EVENT,
                    event: AD_RENDER_SUCCEEDED
                });
            });
        });
    });

    describe('emits AD_RENDER_FAILED', () => {
        Object.entries({
            throws: (ret) => {
                throw ret;
            },
            'returns a promise that rejects': (ret) => Promise.reject(ret)
        }).forEach(([t, transform]) => {
            describe(`when renderer ${t}`, () => {
                Object.entries({
                    'error': {
                        ret: new Error('error message'),
                        info: {
                            reason: 'exception',
                            message: 'error message'
                        }
                    },
                    'error with reason': {
                        ret: {
                            reason: 'failure',
                            message: 'error message'
                        },
                        info: {
                            reason: 'failure',
                            message: 'error message'
                        }
                    }
                }).forEach(([t, {ret, info}]) => {
                    it(`an ${t}`, () => {
                        render.callsFake(() => transform(ret));
                        return runRenderer().then(() => {
                            sinon.assert.calledWith(sendMessage, {
                                adId,
                                message: PREBID_EVENT,
                                event: AD_RENDER_FAILED,
                                info
                            });
                        });
                    });
                });
            });
        });
    });

    describe('renderer sendMessage', () => {
        let rndSendMessage;
        beforeEach(() => {
            render.callsFake(() => new Promise())
            return new Promise((resolve) => {
                render.callsFake((_, {sendMessage}) => {
                    rndSendMessage = sendMessage;
                    resolve();
                });
                runRenderer();
            })
        });
        it('adds message type and adId', () => {
            rndSendMessage('type', {msg: 'data'});
            sinon.assert.calledWith(sendMessage, {
                message: 'type',
                adId,
                msg: 'data'
            });
        });
        it('accepts response listeners', () => {
            const listener = sinon.stub();
            sendMessage.callsFake((_, responseListener) => {
                responseListener('response');
            })
            rndSendMessage('msg', {}, listener);
            sinon.assert.calledWith(listener, 'response');
        });

        it('emits AD_RENDER_FAILED if listener throws', () => {
            const listener = sinon.stub().callsFake(() => { throw new Error('err') });
            sendMessage.callsFake((_, responseListener) => {
                responseListener && responseListener('response');
            });
            rndSendMessage('msg', {}, listener);
            sinon.assert.calledWith(sendMessage, {
                message: PREBID_EVENT,
                event: AD_RENDER_FAILED,
                adId,
                info: {
                    reason: 'exception',
                    message: 'err'
                }
            })
        })
    });

});
