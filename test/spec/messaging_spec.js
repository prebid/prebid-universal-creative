import {mocks} from '../helpers/mocks.js';
import {prebidMessenger} from '../../src/messaging.js';

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
