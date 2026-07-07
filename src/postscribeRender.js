import postscribe from 'postscribe';

export function writeAdHtml(markup, ps = postscribe) {
    // remove <?xml> and <!doctype> tags
    // https://github.com/prebid/prebid-universal-creative/issues/134
    markup = markup.replace(/\<(\?xml|(\!DOCTYPE[^\>\[]+(\[[^\]]+)?))+[^>]+\>/gi, '');

    let finalMarkup;

    try {
        finalMarkup = normalizeMarkup(markup);
    } catch (error) {
        console.error("Error normalizing markup:", error.message);
        finalMarkup = markup;
    }

    ps(document.body, finalMarkup, {
        error: console.error
    });
}

/**
 * Normalizes an HTML string by parsing and re-serializing it,
 * returning the content between custom PUC_START and PUC_END markers.
 *
 * This function is specifically aimed at addressing an issue with `postscribe` where double quotes inside single-quoted
 * HTML attributes are not correctly escaped.
 */
function normalizeMarkup(markup) {
    const timestamp = Date.now();
    const startMarkerId = `PUC_START_${timestamp}`;
    const endMarkerId = `PUC_END_${timestamp}`;
    const startMarker = `<div id="${startMarkerId}"></div>`;
    const endMarker = `<div id="${endMarkerId}"></div>`;
    const doc = new DOMParser().parseFromString(`${startMarker}${markup}${endMarker}`, "text/html");

    const textMap = new Map();
    let textId = 0;

    const replaceTextNodes = (node) => {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
            const id = `PUC_NODE_TEXT_${textId++}_${timestamp}`;
            textMap.set(id, node.textContent);
            const span = doc.createElement("span");
            span.dataset.textId = id;
            node.parentNode.replaceChild(span, node);
        } else {
            [...node.childNodes].forEach(replaceTextNodes);
        }
    };

    let current = doc.querySelector(`#${startMarkerId}`).nextSibling;
    const end = doc.querySelector(`#${endMarkerId}`);
    while (current && current !== end) {
        replaceTextNodes(current);
        current = current.nextSibling;
    }

    const serialized = new XMLSerializer().serializeToString(doc);
    const snippet = serialized
        .split(startMarker)[1]
        .split(endMarker)[0]
        .replace(
            /<span data-text-id="(PUC_NODE_TEXT_\d+_\d+)"[^>]*><\/span>/g,
            (_, id) => textMap.get(id) || ""
        );

    return snippet.trim();
}
