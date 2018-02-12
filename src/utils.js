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
  let parsed = parseHtml(markup);
  let scripts = parsed.querySelectorAll('script');
  for (var i = 0; i < scripts.length; i++) {
    domEval(scripts[i].innerHTML);
    scripts[i].parentNode.removeChild(scripts[i]);
  }
  let givenNodes = parsed.body.childNodes;
  for (var j = 0; j < givenNodes.length; j++) {
    document.body.appendChild(givenNodes[j]);
  }
}

export function domEval(code, doc) {
  doc = doc || document;
  let script = doc.createElement('script');
  script.text = code;
  doc.head.appendChild(script);
}

export function parseHtml(payload) {
  let parser = new DOMParser();
  return parser.parseFromString(payload, 'text/html');
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