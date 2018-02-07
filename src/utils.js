export function createTrackPixelHtml(url) {
  if (!url) {
    return '';
  }

  var escapedUrl = encodeURI(url);
  var img = '<div style="position:absolute;left:0px;top:0px;visibility:hidden;">';
  img += '<img src="' + escapedUrl + '"></div>';
  return img;
}

export function writeAdUrl(adUrl, height, width) {
  var iframe = getEmptyIframe(height, width);
  iframe.src = adUrl;
  document.body.appendChild(iframe);
}

export function writeAdHtml(markup) {
  var parsed = parseHtml(markup);
  var scripts = parsed.querySelectorAll('script');
  for (var i = 0; i < scripts.length; i++) {
    domEval(scripts[i].innerHTML);
    scripts[i].parentNode.removeChild(scripts[i]);
  }
  var givenNodes = parsed.body.childNodes;
  for (var j = 0; j < givenNodes.length; j++) {
    document.body.appendChild(givenNodes[j]);
  }
}

export function domEval(code, doc) {
  doc = doc || document;
  var script = doc.createElement('script');
  script.text = code;
  doc.head.appendChild(script);
}

export function parseHtml(payload) {
  var parser = new DOMParser();
  return parser.parseFromString(payload, 'text/html');
}

export function sendRequest(url, callback) {
  function reqListener() {
    callback(oReq.responseText);
  }

  var oReq = new XMLHttpRequest();
  oReq.addEventListener('load', reqListener);
  oReq.open('GET', url);
  oReq.send();
}

export function getEmptyIframe(height, width) {
  var frame = document.createElement('iframe');
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