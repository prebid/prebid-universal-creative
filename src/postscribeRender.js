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
 * Normalizes an HTML string by parsing and re-serializing it.
 *
 * This function is specifically aimed at addressing an issue with `postscribe` where double quotes inside single-quoted
 * HTML attributes are not correctly escaped.
 */
function normalizeMarkup(markup) {
    const template = document.createElement('template');
    template.innerHTML = markup;
    return template.innerHTML.trim();
}
