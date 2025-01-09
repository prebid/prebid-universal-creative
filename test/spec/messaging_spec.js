import {mocks} from '../helpers/mocks.js';
import {
    AD_RENDER_FAILED,
    AD_RENDER_SUCCEEDED,
    PREBID_EVENT,
    prebidMessenger,
    renderEventMessage
} from '../../src/messaging.js';

describe('prebidMessenger',() => {
    let win;
    beforeEach(() => {
        win = Object.assign(mocks.createFakeWindow(), {
            parent: {
                postMessage: sinon.spy()
            }
        });
    })
    describe('when publisher URL is unavailable', () => {
        let sendMessage;

        beforeEach(() => {
            sendMessage = prebidMessenger(null, win);
        });

        it('should throw', () => {
            expect(() => sendMessage('test')).to.throw();
        })
    });

    describe('when publisher URL is available', () => {
        const URL = 'https://www.publisher.com/page.html';
        const ORIGIN = 'https://www.publisher.com'
        let callback, handler;

        beforeEach(() => {
            win.addEventListener = function (_, h) {
                handler = h;
            }
            win.removeEventListener = sinon.spy();
            callback = sinon.spy();
        })

        function sendMessage(...args) {
            return prebidMessenger(URL, win)(...args);
        }

        it('should use origin for postMessage', () => {
           sendMessage('test');
           sinon.assert.calledWith(win.parent.postMessage, JSON.stringify('test'), ORIGIN);
        });

        describe('when window has multiple ancestors', () => {
            let target;
            beforeEach(() => {
                const top = mocks.createFakeWindow('top');
                target = {
                    ...win.parent,
                    frames: {},
                    parent: {
                        top,
                        frames: {},
                        parent: top
                    }
                };
                win = {
                    top,
                    frames: {},
                    parent: {
                        top,
                        frames: {},
                        parent: target
                    }
                };
            })
            Object.entries({
                throws() { throw new DOMException() },
                'does not throw'() { return {} }
            }).forEach(([t, getFrames]) => {
                describe(`when ancestor ${t}`, () => {
                    beforeEach(() => {
                        Object.defineProperty(target.parent.parent, 'frames', {get: getFrames});
                    })
                    it('should post to first ancestor that has a __pb_locator__ child', () => {
                        [target, target.parent].forEach(win => {
                            win.frames = {
                                __pb_locator__: {}
                            };
                        })
                        sendMessage('test');
                        sinon.assert.called(target.postMessage);
                    });
                })
            })
            it('should post to immediate parent when no ancestor has __pb_locator__', () => {
                win.parent.postMessage = sinon.spy();
                delete target.postMessage;
                sendMessage('test');
                sinon.assert.called(win.parent.postMessage);
            });
            it('should post to first restricted frame if no __pb_locator__ can be found', () => {
                Object.defineProperty(target, 'frames', {get() { throw new DOMException() }});
                sendMessage('test');
                sinon.assert.called(target.postMessage)
            })
        });

        it('should not run callback on response if origin does not mach', ()=> {
           sendMessage('test', callback);
           handler({origin: 'different'});
           expect(callback.called).to.be.false;
        });

        it('should run callback on response if origin does match', () => {
            sendMessage('test', callback);
            const ev = {origin: ORIGIN, data: 'stuff'};
            handler(ev);
            sinon.assert.calledWith(callback, ev);
        });

        it('should remove window listener when canceled', () => {
            sendMessage('test', callback)();
            expect(win.removeEventListener.called).to.be.true;
        })

    });
})

describe('renderEventMessage', () => {
    Object.entries({
        'success': {
            input: {adId: '123'},
            output: {
                event: AD_RENDER_SUCCEEDED
            }
        },
        'failure': {
            input: {
                adId: '321',
                errorInfo: {
                    reason: 'failureReason',
                    message: 'error message'
                }
            },
            output: {
                event: AD_RENDER_FAILED,
                info: {
                    reason: 'failureReason',
                    message: 'error message'
                }
            }
        }
    }).forEach(([t, {input: {adId, errorInfo}, output}]) => {
        Object.assign(output, {message: PREBID_EVENT, adId});
        it(t, () => {
            expect(renderEventMessage(adId, errorInfo)).to.eql(output);
        })
    })
})
