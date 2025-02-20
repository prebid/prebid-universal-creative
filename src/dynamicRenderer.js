import {makeIframe} from './domHelper.js';
import {renderEventMessage} from './messaging.js';

export const MIN_RENDERER_VERSION = 3;

export function hasDynamicRenderer(message) {
    return typeof message.renderer === 'string' && parseInt(message.rendererVersion, 10) >= MIN_RENDERER_VERSION
}

export function runDynamicRenderer(adId, data, sendMessage, win = window, mkFrame = makeIframe) {
    const renderer = mkFrame(win.document, {
        width: 0,
        height: 0,
        style: 'display: none',
        srcdoc: `<script>${data.renderer}</script>`,
        name: '__pb_renderer__'
    });

    return new Promise((resolve, reject) => {
        function onError(e = {}) {
            sendMessage(renderEventMessage(adId, {
                reason: e.reason || 'exception',
                message: e.message
            }));
            e.stack && console.error(e);
            reject(e);
        }

        function guard(fn) {
            return function () {
                try {
                    return fn.apply(this, arguments);
                } catch (e) {
                    onError(e);
                }
            };
        }

        renderer.onload = guard(function () {
            const W = renderer.contentWindow;
            // NOTE: on Firefox, `Promise.resolve(P)` or `new Promise((resolve) => resolve(P))`
            // does not appear to work if P comes from another frame
            W.Promise.resolve(W.render(data, {
                mkFrame,
                sendMessage: (type, payload, onResponse) => sendMessage(
                    Object.assign({adId, message: type}, payload),
                    onResponse ? guard(onResponse) : undefined
                )
            }, win)).then(
                () => sendMessage(renderEventMessage(adId)),
                onError
            ).then(resolve);
        });
        win.document.body.appendChild(renderer);
    });
}
