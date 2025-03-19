export function writeAdHtml(markup, insertHTML = appendToBody) {
    // remove <?xml> and <!doctype> tags
    // https://github.com/prebid/prebid-universal-creative/issues/134
    markup = markup.replace(/\<(\?xml|(\!DOCTYPE[^\>\[]+(\[[^\]]+)?))+[^>]+\>/gi, '');
    insertHTML(markup);
}

function appendToBody(html) {
    try {
        const fragment = document.createRange().createContextualFragment(html);
        document.body.append(fragment);
    } catch (error) {
        console.error(error);
    }
}