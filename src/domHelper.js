/**
 * domHelper: a collection of helpful dom things
 */


/**
 * returns a empty iframe element with specified height/width
 * @param {Number} height height iframe set to 
 * @param {Number} width width iframe set to
 * @returns {Element} iframe DOM element 
 */
export function getEmptyIframe(height, width) {
    let frame = document.createElement('iframe');
    frame.setAttribute('frameborder', 0);
    frame.setAttribute('scrolling', 'no');
    frame.setAttribute('marginheight', 0);
    frame.setAttribute('marginwidth', 0);
    frame.setAttribute('TOPMARGIN', 0);
    frame.setAttribute('LEFTMARGIN', 0);
    frame.setAttribute('allowtransparency', 'true');
    frame.setAttribute('width', width);
    frame.setAttribute('height', height);
    return frame;
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