import postscribe from 'postscribe';

export function writeAdHtml(markup, ps = postscribe) {
    // remove <?xml> and <!doctype> tags
    // https://github.com/prebid/prebid-universal-creative/issues/134
    markup = markup
        .replace(/<\?xml\b[^>]*\?>/gi, '')
        .replace(/<!doctype\b[^>\[]*(?:\[[^\]]*\][^>]*)?>/gi, '');
    ps(document.body, markup, {
        error: console.error
    });
}
