/**
 * domHelper: a collection of helpful dom things
 */



/**
 * returns a empty iframe element with specified attributes.
 */
export function makeIframe(doc, attrs = {}) {
    const frame = doc.createElement('iframe');
    Object.entries(Object.assign({
        frameborder: 0,
        scrolling: 'no',
        marginheight: 0,
        marginwidth: 0,
        TOPMARGIN: 0,
        LEFTMARGIN: 0,
        allowtransparency: 'true'
    }, attrs)).forEach(([attr, value]) => {
        frame.setAttribute(attr, value);
    });
    return frame;
}

/**
 * returns a empty iframe element with specified height/width
 * @param {Number} height height iframe set to
 * @param {Number} width width iframe set to
 * @returns {Element} iframe DOM element
 */
export function getEmptyIframe(height, width) {
    return makeIframe(document, {height, width})
}

  /**
 * Insert element to passed target
 * @param {object} elm
 * @param {object} doc
 * @param {string} target
 */
export function insertElement(elm, doc, target) {
    doc = doc || document;
    let elToAppend;
    if (target) {
      elToAppend = doc.getElementsByTagName(target);
    } else {
      elToAppend = doc.getElementsByTagName('head');
    }
    try {
      elToAppend = elToAppend.length ? elToAppend : doc.getElementsByTagName('body');
      if (elToAppend.length) {
        elToAppend = elToAppend[0];
        elToAppend.insertBefore(elm, elToAppend.firstChild);
      }
    } catch (e) {}
  }
