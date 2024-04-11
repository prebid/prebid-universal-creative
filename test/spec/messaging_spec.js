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
        let sendMessage;
        let callback, handler;

        beforeEach(() => {
            win.addEventListener = function (_, h) {
                handler = h;
            }
            win.removeEventListener = sinon.spy();
            sendMessage = prebidMessenger(URL, win);
            callback = sinon.spy();
        })

        it('should use origin for postMessage', () => {
           sendMessage('test');
           sinon.assert.calledWith(win.parent.postMessage, JSON.stringify('test'), ORIGIN);
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
