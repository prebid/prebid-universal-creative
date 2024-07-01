import {parseUrl} from './utils.js';

export function prebidMessenger(publisherURL, win = window) {
    const prebidDomain = (() => {
        if (publisherURL == null) {
            return null;
        }
        const parsedUrl = parseUrl(publisherURL);
        return parsedUrl.protocol + '://' + parsedUrl.host;
    })();

    function isPrebidWindow(win) {
        return win && win.frames && win.frames.__pb_locator__;
    }

    let target = win.parent;
    while (target != null && target !== win.top && !isPrebidWindow(target)) target = target.parent;
    if (!isPrebidWindow(target)) target = win.parent;

    return function sendMessage(message, onResponse) {
        if (prebidDomain == null) {
            throw new Error('Missing pubUrl')
        }
        message = JSON.stringify(message);
        let messagePort;
        if (onResponse == null) {
            target.postMessage(message, prebidDomain);
        } else {
            const channel = new MessageChannel();
            messagePort = channel.port1;
            messagePort.onmessage = onResponse;
            win.addEventListener('message', windowListener);
            target.postMessage(message, prebidDomain, [channel.port2]);
        }

        return function stopListening() {
            if (messagePort != null) {
                win.removeEventListener('message', windowListener);
                messagePort.onmessage = null;
                messagePort = null;
            }
        }

        function windowListener(ev) {
            if ((ev.origin || (ev.originalEvent && ev.originalEvent.origin)) === prebidDomain) {
                onResponse(ev);
            }
        }

    }
}
