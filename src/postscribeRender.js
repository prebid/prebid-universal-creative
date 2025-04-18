import postscribe from 'postscribe';

export function writeAdHtml(markup, ps = postscribe) {
    // remove <?xml> and <!doctype> tags
    // https://github.com/prebid/prebid-universal-creative/issues/134
    markup = markup.replace(/\<(\?xml|(\!DOCTYPE[^\>\[]+(\[[^\]]+)?))+[^>]+\>/g, '');
    ps(document.body, markup, {
        error: console.error
    });
}
