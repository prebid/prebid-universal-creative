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
    const startMarker = `<div id="PUC_START_${timestamp}"></div>`;
    const endMarker = `<div id="PUC_END_${timestamp}"></div>`;

    const wrapped = `${startMarker}${markup}${endMarker}`;

    const doc = new DOMParser().parseFromString(wrapped, "text/html");
    const serialized = new XMLSerializer().serializeToString(doc);

    const startIndex = serialized.indexOf(startMarker);
    const endIndex = serialized.indexOf(endMarker, startIndex);

    if (startIndex === -1 || endIndex === -1) {
        throw new Error("PUC markers not found in serialized output");
    }

    console.log('Testing:' + serialized);

    const snippet = serialized.substring(startIndex + startMarker.length, endIndex);
    return snippet.trim();
}