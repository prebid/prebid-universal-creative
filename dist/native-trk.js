/* v0.4.0
Updated : 2018-10-15 */
!function(r){var n={};function o(t){if(n[t])return n[t].exports;var e=n[t]={i:t,l:!1,exports:{}};return r[t].call(e.exports,e,e.exports,o),e.l=!0,e.exports}o.m=r,o.c=n,o.d=function(t,e,r){o.o(t,e)||Object.defineProperty(t,e,{configurable:!1,enumerable:!0,get:r})},o.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return o.d(e,"a",e),e},o.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},o.p="",o(o.s=0)}([function(t,e,r){"use strict";var n=r(1);window.pbNativeTag=window.pbNativeTag||{};var o=(0,n.newNativeTrackerManager)(window);window.pbNativeTag.startTrackers=o.startTrackers},function(t,e,r){"use strict";Object.defineProperty(e,"__esModule",{value:!0}),e.newNativeTrackerManager=function(i){var a=void 0;function s(t){var e,r=(e=t)&&e.target&&e.target.attributes&&e.target.attributes[o]&&e.target.attributes[o].value||"";n(r,"click")}function u(t){var e,r=0<(e=t).length&&e[0].attributes&&e[0].attributes[o]&&e[0].attributes[o].value||"";n(r,"impression")}function n(t,e){if(""===t)console.warn("Prebid tracking event was missing 'adId'.  Was adId macro set in the HTML attribute "+o+"on the ad's anchor element");else{var r={message:"Prebid Native",adId:t};"click"===e&&(r.action="click"),i.parent.postMessage(JSON.stringify(r),a)}}return{startTrackers:function(t){var e=(0,c.parseUrl)(t&&t.pubUrl);a=e.protocol+"://"+e.host;for(var r,n=(r=l,i.document.getElementsByClassName(r)||[]),o=0;o<n.length;o++)n[o].addEventListener("click",s,!0);0<n.length&&u(n)}}};var c=r(2),l="pb-click",o="pbAdId"},function(t,n,e){"use strict";Object.defineProperty(n,"__esModule",{value:!0}),n.createTrackPixelHtml=function(t){return t?'<div style="position:absolute;left:0px;top:0px;visibility:hidden;"><img src="'+encodeURI(t)+'"></div>':""},n.writeAdUrl=function(t,e,r){var n=o(r,e);n.src=t,document.body.appendChild(n)},n.writeAdHtml=function(t){r(document.body,t)},n.sendRequest=function(t,e){var r=new XMLHttpRequest;r.addEventListener("load",function(){e(r.responseText)}),r.open("GET",t),r.send()},n.getEmptyIframe=o,n.getUUID=function(){var r=(new Date).getTime();return"xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,function(t){var e=(r+16*Math.random())%16|0;return r=Math.floor(r/16),("x"===t?e:3&e|8).toString(16)})},n.loadScript=function(t,e,r){var n=t.document,o=n.createElement("script");o.type="text/javascript",r&&"function"==typeof r&&(o.readyState?o.onreadystatechange=function(){"loaded"!==o.readyState&&"complete"!==o.readyState||(o.onreadystatechange=null,r())}:o.onload=function(){r()});o.src=e;var i=n.getElementsByTagName("head");(i=i.length?i:n.getElementsByTagName("body")).length&&(i=i[0]).insertBefore(o,i.firstChild);return o},n.getCreativeComment=function(t){return document.createComment("Creative "+t.crid+" served by Prebid.js Header Bidding")},n.getCreativeCommentMarkup=function(t){var e=n.getCreativeComment(t),r=document.createElement("div");return r.appendChild(e),r.innerHTML},n.insertElement=function(t,e,r){e=e||document;var n=void 0;n=r?e.getElementsByTagName(r):e.getElementsByTagName("head");try{(n=n.length?n:e.getElementsByTagName("body")).length&&(n=n[0]).insertBefore(t,n.firstChild)}catch(t){}},n.triggerBurl=function(t){(new Image).src=t},n.transformAuctionTargetingData=function(e){var r={hb_adid:"adId",hb_cache_host:"cacheHost",hb_cache_path:"cachePath",hb_cache_id:"uuid",hb_format:"mediaType",hb_env:"env",hb_size:"size"},n={},o=e.targetingMap||{},t=Object.keys(o);0<t.length&&t.forEach(function(t){if(Array.isArray(o[t])&&0<o[t].length){var e=r[t]||t;n[e]=o[t][0]}});return Object.keys(e).forEach(function(t){"targetingMap"!==t&&"string"==typeof e[t]&&(n[t]=e[t])}),n},n.parseUrl=function(t){var e=document.createElement("a");return e.href=t,{href:e.href,protocol:(e.protocol||"").replace(/:$/,""),hostname:e.hostname,port:+e.port,pathname:e.pathname.replace(/^(?!\/)/,"/"),hash:(e.hash||"").replace(/^#/,""),host:e.host||window.location.host}};var r=e(3);function o(t,e){var r=document.createElement("iframe");return r.setAttribute("frameborder",0),r.setAttribute("scrolling","no"),r.setAttribute("marginheight",0),r.setAttribute("marginwidth",0),r.setAttribute("TOPMARGIN",0),r.setAttribute("LEFTMARGIN",0),r.setAttribute("allowtransparency","true"),r.setAttribute("width",e),r.setAttribute("height",t),r}},function(t,e,r){var n;n=function(){return function(r){var n={};function o(t){if(n[t])return n[t].exports;var e=n[t]={exports:{},id:t,loaded:!1};return r[t].call(e.exports,e,e.exports,o),e.loaded=!0,e.exports}return o.m=r,o.c=n,o.p="",o(0)}([function(t,e,r){"use strict";var n,o=r(1),i=(n=o)&&n.__esModule?n:{default:n};t.exports=i.default},function(t,e,r){"use strict";e.__esModule=!0;var s=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}return t};e.default=d;var n,o=r(2),u=(n=o)&&n.__esModule?n:{default:n},i=function(t){{if(t&&t.__esModule)return t;var e={};if(null!=t)for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r]);return e.default=t,e}}(r(4));function c(){}var a={afterAsync:c,afterDequeue:c,afterStreamStart:c,afterWrite:c,autoFix:!0,beforeEnqueue:c,beforeWriteToken:function(t){return t},beforeWrite:function(t){return t},done:c,error:function(t){throw new Error(t.msg)},releaseAsync:!1},l=0,p=[],f=null;function h(){var t=p.shift();if(t){var e=i.last(t);e.afterDequeue(),t.stream=function(t,e,n){(f=new u.default(t,n)).id=l++,f.name=n.name||f.id,d.streams[f.name]=f;var r=t.ownerDocument,o={close:r.close,open:r.open,write:r.write,writeln:r.writeln};function i(t){t=n.beforeWrite(t),f.write(t),n.afterWrite(t)}s(r,{close:c,open:c,write:function(){for(var t=arguments.length,e=Array(t),r=0;r<t;r++)e[r]=arguments[r];return i(e.join(""))},writeln:function(){for(var t=arguments.length,e=Array(t),r=0;r<t;r++)e[r]=arguments[r];return i(e.join("")+"\n")}});var a=f.win.onerror||c;return f.win.onerror=function(t,e,r){n.error({msg:t+" - "+e+": "+r}),a.apply(f.win,[t,e,r])},f.write(e,function(){s(r,o),f.win.onerror=a,n.done(),f=null,h()}),f}.apply(void 0,t),e.afterStreamStart()}}function d(t,e,r){if(i.isFunction(r))r={done:r};else if("clear"===r)return p=[],f=null,void(l=0);r=i.defaults(r,a);var n=[t=/^#/.test(t)?window.document.getElementById(t.substr(1)):t.jquery?t[0]:t,e,r];return t.postscribe={cancel:function(){n.stream?n.stream.abort():n[1]=c}},r.beforeEnqueue(n),p.push(n),f||h(),t.postscribe}s(d,{streams:{},queue:p,WriteStream:u.default})},function(t,e,r){"use strict";e.__esModule=!0;var n,s=Object.assign||function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}return t},o=r(3),i=(n=o)&&n.__esModule?n:{default:n},a=function(t){{if(t&&t.__esModule)return t;var e={};if(null!=t)for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r]);return e.default=t,e}}(r(4));var l="data-ps-",p="ps-style",f="ps-script";function u(t,e){var r=l+e,n=t.getAttribute(r);return a.existy(n)?String(n):n}function c(t,e){var r=2<arguments.length&&void 0!==arguments[2]?arguments[2]:null,n=l+e;a.existy(r)&&""!==r?t.setAttribute(n,r):t.removeAttribute(n)}var h=function(){function r(t){var e=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{};!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,r),this.root=t,this.options=e,this.doc=t.ownerDocument,this.win=this.doc.defaultView||this.doc.parentWindow,this.parser=new i.default("",{autoFix:e.autoFix}),this.actuals=[t],this.proxyHistory="",this.proxyRoot=this.doc.createElement(t.nodeName),this.scriptStack=[],this.writeQueue=[],c(this.proxyRoot,"proxyof",0)}return r.prototype.write=function(){var t;for((t=this.writeQueue).push.apply(t,arguments);!this.deferredRemote&&this.writeQueue.length;){var e=this.writeQueue.shift();a.isFunction(e)?this._callFunction(e):this._writeImpl(e)}},r.prototype._callFunction=function(t){var e={type:"function",value:t.name||t.toString()};this._onScriptStart(e),t.call(this.win,this.doc),this._onScriptDone(e)},r.prototype._writeImpl=function(t){this.parser.append(t);for(var e=void 0,r=void 0,n=void 0,o=[];(e=this.parser.readToken())&&!(r=a.isScript(e))&&!(n=a.isStyle(e));)(e=this.options.beforeWriteToken(e))&&o.push(e);0<o.length&&this._writeStaticTokens(o),r&&this._handleScriptToken(e),n&&this._handleStyleToken(e)},r.prototype._writeStaticTokens=function(t){var e=this._buildChunk(t);return e.actual?(e.html=this.proxyHistory+e.actual,this.proxyHistory+=e.proxy,this.proxyRoot.innerHTML=e.html,this._walkChunk(),e):null},r.prototype._buildChunk=function(t){for(var e=this.actuals.length,r=[],n=[],o=[],i=t.length,a=0;a<i;a++){var s=t[a],u=s.toString();if(r.push(u),s.attrs){if(!/^noscript$/i.test(s.tagName)){var c=e++;n.push(u.replace(/(\/?>)/," "+l+"id="+c+" $1")),s.attrs.id!==f&&s.attrs.id!==p&&o.push("atomicTag"===s.type?"":"<"+s.tagName+" "+l+"proxyof="+c+(s.unary?" />":">"))}}else n.push(u),o.push("endTag"===s.type?u:"")}return{tokens:t,raw:r.join(""),actual:n.join(""),proxy:o.join("")}},r.prototype._walkChunk=function(){for(var t=void 0,e=[this.proxyRoot];a.existy(t=e.shift());){var r=1===t.nodeType;if(!(r&&u(t,"proxyof"))){r&&c(this.actuals[u(t,"id")]=t,"id");var n=t.parentNode&&u(t.parentNode,"proxyof");n&&this.actuals[n].appendChild(t)}e.unshift.apply(e,a.toArray(t.childNodes))}},r.prototype._handleScriptToken=function(t){var e=this,r=this.parser.clear();r&&this.writeQueue.unshift(r),t.src=t.attrs.src||t.attrs.SRC,(t=this.options.beforeWriteToken(t))&&(t.src&&this.scriptStack.length?this.deferredRemote=t:this._onScriptStart(t),this._writeScriptToken(t,function(){e._onScriptDone(t)}))},r.prototype._handleStyleToken=function(t){var e=this.parser.clear();e&&this.writeQueue.unshift(e),t.type=t.attrs.type||t.attrs.TYPE||"text/css",(t=this.options.beforeWriteToken(t))&&this._writeStyleToken(t),e&&this.write()},r.prototype._writeStyleToken=function(t){var e=this._buildStyle(t);this._insertCursor(e,p),t.content&&(e.styleSheet&&!e.sheet?e.styleSheet.cssText=t.content:e.appendChild(this.doc.createTextNode(t.content)))},r.prototype._buildStyle=function(t){var r=this.doc.createElement(t.tagName);return r.setAttribute("type",t.type),a.eachKey(t.attrs,function(t,e){r.setAttribute(t,e)}),r},r.prototype._insertCursor=function(t,e){this._writeImpl('<span id="'+e+'"/>');var r=this.doc.getElementById(e);r&&r.parentNode.replaceChild(t,r)},r.prototype._onScriptStart=function(t){t.outerWrites=this.writeQueue,this.writeQueue=[],this.scriptStack.unshift(t)},r.prototype._onScriptDone=function(t){t===this.scriptStack[0]?(this.scriptStack.shift(),this.write.apply(this,t.outerWrites),!this.scriptStack.length&&this.deferredRemote&&(this._onScriptStart(this.deferredRemote),this.deferredRemote=null)):this.options.error({msg:"Bad script nesting or script finished twice"})},r.prototype._writeScriptToken=function(t,e){var r=this._buildScript(t),n=this._shouldRelease(r),o=this.options.afterAsync;t.src&&(r.src=t.src,this._scriptLoadHandler(r,n?o:function(){e(),o()}));try{this._insertCursor(r,f),r.src&&!n||e()}catch(t){this.options.error(t),e()}},r.prototype._buildScript=function(t){var r=this.doc.createElement(t.tagName);return a.eachKey(t.attrs,function(t,e){r.setAttribute(t,e)}),t.content&&(r.text=t.content),r},r.prototype._scriptLoadHandler=function(e,r){function n(){e=e.onload=e.onreadystatechange=e.onerror=null}var o=this.options.error;function t(){n(),null!=r&&r(),r=null}function i(t){n(),o(t),null!=r&&r(),r=null}function a(t,e){var r=t["on"+e];null!=r&&(t["_on"+e]=r)}a(e,"load"),a(e,"error"),s(e,{onload:function(){if(e._onload)try{e._onload.apply(this,Array.prototype.slice.call(arguments,0))}catch(t){i({msg:"onload handler failed "+t+" @ "+e.src})}t()},onerror:function(){if(e._onerror)try{e._onerror.apply(this,Array.prototype.slice.call(arguments,0))}catch(t){return void i({msg:"onerror handler failed "+t+" @ "+e.src})}i({msg:"remote script failed "+e.src})},onreadystatechange:function(){/^(loaded|complete)$/.test(e.readyState)&&t()}})},r.prototype._shouldRelease=function(t){return!/^script$/i.test(t.nodeName)||!!(this.options.releaseAsync&&t.src&&t.hasAttribute("async"))},r}();e.default=h},function(t,e,r){var n;n=function(){return function(r){var n={};function o(t){if(n[t])return n[t].exports;var e=n[t]={exports:{},id:t,loaded:!1};return r[t].call(e.exports,e,e.exports,o),e.loaded=!0,e.exports}return o.m=r,o.c=n,o.p="",o(0)}([function(t,e,r){"use strict";var n,o=r(1),i=(n=o)&&n.__esModule?n:{default:n};t.exports=i.default},function(t,e,r){"use strict";e.__esModule=!0;var n,s=c(r(2)),o=c(r(3)),i=r(6),u=(n=i)&&n.__esModule?n:{default:n},a=r(5);function c(t){if(t&&t.__esModule)return t;var e={};if(null!=t)for(var r in t)Object.prototype.hasOwnProperty.call(t,r)&&(e[r]=t[r]);return e.default=t,e}var l={comment:/^<!--/,endTag:/^<\//,atomicTag:/^<\s*(script|style|noscript|iframe|textarea)[\s\/>]/i,startTag:/^</,chars:/^[^<]/},p=function(){function a(){var t=this,e=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"",r=1<arguments.length&&void 0!==arguments[1]?arguments[1]:{};!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,a),this.stream=e;var n=!1,o={};for(var i in s)s.hasOwnProperty(i)&&(r.autoFix&&(o[i+"Fix"]=!0),n=n||o[i+"Fix"]);this._peekToken=n?(this._readToken=(0,u.default)(this,o,function(){return t._readTokenImpl()}),(0,u.default)(this,o,function(){return t._peekTokenImpl()})):(this._readToken=this._readTokenImpl,this._peekTokenImpl)}return a.prototype.append=function(t){this.stream+=t},a.prototype.prepend=function(t){this.stream=t+this.stream},a.prototype._readTokenImpl=function(){var t=this._peekTokenImpl();if(t)return this.stream=this.stream.slice(t.length),t},a.prototype._peekTokenImpl=function(){for(var t in l)if(l.hasOwnProperty(t)&&l[t].test(this.stream)){var e=o[t](this.stream);if(e)return"startTag"===e.type&&/script|style/i.test(e.tagName)?null:(e.text=this.stream.substr(0,e.length),e)}},a.prototype.peekToken=function(){return this._peekToken()},a.prototype.readToken=function(){return this._readToken()},a.prototype.readTokens=function(t){for(var e=void 0;e=this.readToken();)if(t[e.type]&&!1===t[e.type](e))return},a.prototype.clear=function(){var t=this.stream;return this.stream="",t},a.prototype.rest=function(){return this.stream},a}();for(var f in(e.default=p).tokenToString=function(t){return t.toString()},p.escapeAttributes=function(t){var e={};for(var r in t)t.hasOwnProperty(r)&&(e[r]=(0,a.escapeQuotes)(t[r],null));return e},p.supports=s)s.hasOwnProperty(f)&&(p.browserHasFlaw=p.browserHasFlaw||!s[f]&&f)},function(t,e){"use strict";var r=!(e.__esModule=!0),n=!1,o=window.document.createElement("div");try{var i="<P><I></P></I>";o.innerHTML=i,e.tagSoup=r=o.innerHTML!==i}catch(t){e.tagSoup=r=!1}try{o.innerHTML="<P><i><P></P></i></P>",e.selfClose=n=2===o.childNodes.length}catch(t){e.selfClose=n=!1}o=null,e.tagSoup=r,e.selfClose=n},function(t,e,r){"use strict";e.__esModule=!0;var a="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};e.comment=function(t){var e=t.indexOf("--\x3e");if(0<=e)return new s.CommentToken(t.substr(4,e-1),e+3)},e.chars=function(t){var e=t.indexOf("<");return new s.CharsToken(0<=e?e:t.length)},e.startTag=o,e.atomicTag=function(t){var e=o(t);if(e){var r=t.slice(e.length);if(r.match(new RegExp("</\\s*"+e.tagName+"\\s*>","i"))){var n=r.match(new RegExp("([\\s\\S]*?)</\\s*"+e.tagName+"\\s*>","i"));if(n)return new s.AtomicTagToken(e.tagName,n[0].length+e.length,e.attrs,e.booleanAttrs,n[1])}}},e.endTag=function(t){var e=t.match(u.endTag);if(e)return new s.EndTagToken(e[1],e[0].length)};var s=r(4),u={startTag:/^<([\-A-Za-z0-9_]+)((?:\s+[\w\-]+(?:\s*=?\s*(?:(?:"[^"]*")|(?:'[^']*')|[^>\s]+))?)*)\s*(\/?)>/,endTag:/^<\/([\-A-Za-z0-9_]+)[^>]*>/,attr:/(?:([\-A-Za-z0-9_]+)\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))|(?:([\-A-Za-z0-9_]+)(\s|$)+)/g,fillAttr:/^(checked|compact|declare|defer|disabled|ismap|multiple|nohref|noresize|noshade|nowrap|readonly|selected)$/i};function o(t){var r,n,o;if(-1!==t.indexOf(">")){var e=t.match(u.startTag);if(e){var i=(r={},n={},o=e[2],e[2].replace(u.attr,function(t,e){arguments[2]||arguments[3]||arguments[4]||arguments[5]?arguments[5]?(r[arguments[5]]="",n[arguments[5]]=!0):r[e]=arguments[2]||arguments[3]||arguments[4]||u.fillAttr.test(e)&&e||"":r[e]="",o=o.replace(t,"")}),{v:new s.StartTagToken(e[1],e[0].length,r,n,!!e[3],o.replace(/^[\s\uFEFF\xA0]+|[\s\uFEFF\xA0]+$/g,""))});if("object"===(void 0===i?"undefined":a(i)))return i.v}}}},function(t,e,r){"use strict";e.__esModule=!0,e.EndTagToken=e.AtomicTagToken=e.StartTagToken=e.TagToken=e.CharsToken=e.CommentToken=e.Token=void 0;var a=r(5);function s(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}e.Token=function t(e,r){s(this,t),this.type=e,this.length=r,this.text=""},e.CommentToken=function(){function r(t,e){s(this,r),this.type="comment",this.length=e||(t?t.length:0),this.text="",this.content=t}return r.prototype.toString=function(){return"\x3c!--"+this.content},r}(),e.CharsToken=function(){function e(t){s(this,e),this.type="chars",this.length=t,this.text=""}return e.prototype.toString=function(){return this.text},e}();var n=e.TagToken=function(){function i(t,e,r,n,o){s(this,i),this.type=t,this.length=r,this.text="",this.tagName=e,this.attrs=n,this.booleanAttrs=o,this.unary=!1,this.html5Unary=!1}return i.formatTag=function(t){var e=1<arguments.length&&void 0!==arguments[1]?arguments[1]:null,r="<"+t.tagName;for(var n in t.attrs)if(t.attrs.hasOwnProperty(n)){r+=" "+n;var o=t.attrs[n];void 0!==t.booleanAttrs&&void 0!==t.booleanAttrs[n]||(r+='="'+(0,a.escapeQuotes)(o)+'"')}return t.rest&&(r+=" "+t.rest),t.unary&&!t.html5Unary?r+="/>":r+=">",null!=e&&(r+=e+"</"+t.tagName+">"),r},i}();e.StartTagToken=function(){function a(t,e,r,n,o,i){s(this,a),this.type="startTag",this.length=e,this.text="",this.tagName=t,this.attrs=r,this.booleanAttrs=n,this.html5Unary=!1,this.unary=o,this.rest=i}return a.prototype.toString=function(){return n.formatTag(this)},a}(),e.AtomicTagToken=function(){function i(t,e,r,n,o){s(this,i),this.type="atomicTag",this.length=e,this.text="",this.tagName=t,this.attrs=r,this.booleanAttrs=n,this.unary=!1,this.html5Unary=!1,this.content=o}return i.prototype.toString=function(){return n.formatTag(this,this.content)},i}(),e.EndTagToken=function(){function r(t,e){s(this,r),this.type="endTag",this.length=e,this.text="",this.tagName=t}return r.prototype.toString=function(){return"</"+this.tagName+">"},r}()},function(t,e){"use strict";e.__esModule=!0,e.escapeQuotes=function(t){var e=1<arguments.length&&void 0!==arguments[1]?arguments[1]:"";return t?t.replace(/([^"]*)"/g,function(t,e){return/\\/.test(e)?e+'"':e+'\\"'}):e}},function(t,e){"use strict";e.__esModule=!0,e.default=function(i,r,a){var n=(t=[],t.last=function(){return this[this.length-1]},t.lastTagNameEq=function(t){var e=this.last();return e&&e.tagName&&e.tagName.toUpperCase()===t.toUpperCase()},t.containsTagName=function(t){for(var e,r=0;e=this[r];r++)if(e.tagName===t)return!0;return!1},t),s={startTag:function(t){var e=t.tagName;"TR"===e.toUpperCase()&&n.lastTagNameEq("TABLE")?(i.prepend("<TBODY>"),o()):r.selfCloseFix&&u.test(e)&&n.containsTagName(e)?n.lastTagNameEq(e)?l(i,n):(i.prepend("</"+t.tagName+">"),o()):t.unary||n.push(t)},endTag:function(t){var e=n.last();e?r.tagSoupFix&&!n.lastTagNameEq(t.tagName)?l(i,n):n.pop():r.tagSoupFix&&(a(),o())}};var t;function o(){var t,e,r,n,o=(e=a,r=(t=i).stream,n=c(e()),t.stream=r,n);o&&s[o.type]&&s[o.type](o)}return function(){return o(),c(a())}};var r=/^(AREA|BASE|BASEFONT|BR|COL|FRAME|HR|IMG|INPUT|ISINDEX|LINK|META|PARAM|EMBED)$/i,u=/^(COLGROUP|DD|DT|LI|OPTIONS|P|TD|TFOOT|TH|THEAD|TR)$/i;function c(t){return t&&"startTag"===t.type&&(t.unary=r.test(t.tagName)||t.unary,t.html5Unary=!/\/>$/.test(t.text)),t}function l(t,e){var r=e.pop();t.prepend("</"+r.tagName+">")}}])},t.exports=n()},function(t,e){"use strict";e.__esModule=!0;var o="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t};function n(t){return null!=t}function i(t,e,r){var n=void 0,o=t&&t.length||0;for(n=0;n<o;n++)e.call(r,t[n],n)}function a(t,e,r){for(var n in t)t.hasOwnProperty(n)&&e.call(r,n,t[n])}function r(t,e){return!(!t||"startTag"!==t.type&&"atomicTag"!==t.type||!("tagName"in t))&&!!~t.tagName.toLowerCase().indexOf(e)}e.existy=n,e.isFunction=function(t){return"function"==typeof t},e.each=i,e.eachKey=a,e.defaults=function(r,t){return r=r||{},a(t,function(t,e){n(r[t])||(r[t]=e)}),r},e.toArray=function(e){try{return Array.prototype.slice.call(e)}catch(t){var r=(n=[],i(e,function(t){n.push(t)}),{v:n});if("object"===(void 0===r?"undefined":o(r)))return r.v}var n},e.last=function(t){return t[t.length-1]},e.isTag=r,e.isScript=function(t){return r(t,"script")},e.isStyle=function(t){return r(t,"style")}}])},t.exports=n()}]);