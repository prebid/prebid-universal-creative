const postscribe = require('postscribe');

export function createTrackPixelHtml(url) {
  if (!url) {
    return '';
  }

  let escapedUrl = encodeURI(url);
  let img = `<div style="position:absolute;left:0px;top:0px;visibility:hidden;"><img src="${escapedUrl}"></div>`;
  return img;
}

export function writeAdUrl(adUrl, height, width) {
  let iframe = getEmptyIframe(height, width);
  iframe.src = adUrl;
  document.body.appendChild(iframe);
}

export function writeAdHtml(markup) {
  postscribe(document.body, markup);
}

export function sendRequest(url, callback) {
  function reqListener() {
    callback(oReq.responseText);
  }

  let oReq = new XMLHttpRequest();
  oReq.addEventListener('load', reqListener);
  oReq.open('GET', url);
  oReq.send();
}

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
};
