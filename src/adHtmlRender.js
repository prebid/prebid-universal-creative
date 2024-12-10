export function writeAdHtml(markup, insertHTML = document.body.insertAdjacentHTML.bind(document.body)) {
    // remove <?xml> and <!doctype> tags
    // https://github.com/prebid/prebid-universal-creative/issues/134
    markup = markup.replace(/\<(\?xml|(\!DOCTYPE[^\>\[]+(\[[^\]]+)?))+[^>]+\>/gi, '');

    try {
        insertHTML('beforeend', markup);
    } catch (error) {
        console.error(error);
    }
}
