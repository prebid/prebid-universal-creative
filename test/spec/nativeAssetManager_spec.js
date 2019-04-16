import { expect } from 'chai';
import { merge } from 'lodash';
import { newNativeAssetManager } from 'src/nativeAssetManager';
import { mocks } from 'test/helpers/mocks';

const AD_ID = 'abc123';

const mockDocument = {
  getWindowObject: function() {
    return {
      addEventListener: sinon.spy(),
      removeEventListener: sinon.spy(),
      parent: { postMessage: sinon.spy() },
    };
  }
};

// creates mock postmessage response from prebid's native.js:getAssetMessage
function createResponder(assets) {
  return function(type, listener) {
    if (type !== 'message') { return; }

    const data = { message: 'assetResponse', adId: AD_ID, assets };
    listener({ data: JSON.stringify(data) });
  };
}

describe('nativeAssetManager', () => {
  let win;

  beforeEach(() => {
    win = merge(mocks.createFakeWindow(), mockDocument.getWindowObject());
  });

  it('replaces native placeholders with their asset values while using sendId notation', () => {
    win.document.body.innerHTML = `
      <h1>hb_native_title</h1>
      <p>hb_native_body:${AD_ID}</p>
      <a href="hb_native_linkurl:${AD_ID}">Click Here</a>
    `;
    win.addEventListener = createResponder([
      { key: 'body', value: 'new value' },
      { key: 'clickUrl', value: 'http://www.example.com' },
    ]);

    const nativeAssetManager = newNativeAssetManager(win);
    nativeAssetManager.loadAssets(AD_ID);

    expect(win.document.body.innerHTML).to.include('<p>new value</p>');
    expect(win.document.body.innerHTML).to.include(`
      <a href="http://www.example.com">Click Here</a>
    `);
    // title was not a requested asset so this should stay as is
    expect(win.document.body.innerHTML).to.include('<h1>hb_native_title</h1>');
  });

  it('replaces native placeholders with their asset values while using hardKey notation', () => {
    win.document.body.innerHTML = `
      <h1>hb_native_title</h1>
      <p>%%hb_native_body%%</p>
      <a href="%%hb_native_linkurl%%">Click Here</a>
      <img class="pb-icon" height="10" width="10" />
    `;
    win.document.body.getElementsByClassName = sinon.stub().returns([{
      setAttribute: function(property, val) {
        let attribute = `class="pb-icon" ${property}="${val}"`
        win.document.body.innerHTML = win.document.body.innerHTML.replace('class="pb-icon"', attribute);
      }
    }]);
    win.addEventListener = createResponder([
      { key: 'body', value: 'new value' },
      { key: 'clickUrl', value: 'http://www.example.com' },
      { key: 'icon', value: 'http://my.fake.images/somewhere/lost/1x1.gif' }
    ]);

    const nativeAssetManager = newNativeAssetManager(win);
    nativeAssetManager.loadAssets(AD_ID);

    expect(win.document.body.innerHTML).to.include('<p>new value</p>');
    expect(win.document.body.innerHTML).to.include(`
      <a href="http://www.example.com">Click Here</a>
    `);
    expect(win.document.body.innerHTML).to.include(`
      <img class="pb-icon" src="http://my.fake.images/somewhere/lost/1x1.gif" height="10" width="10" />
    `)
    // title was not a requested asset so this should stay as is
    expect(win.document.body.innerHTML).to.include('<h1>hb_native_title</h1>');
  });

  it('attaches and removes message listeners', () => {
    win.document.body.innerHTML = `<h1>hb_native_title:${AD_ID}</h1>`;
    win.addEventListener = createResponder();

    const nativeAssetManager = newNativeAssetManager(win);
    nativeAssetManager.loadAssets(AD_ID);

    expect(win.parent.postMessage.callCount).to.equal(1);
    expect(win.removeEventListener.callCount).to.equal(1);
  });

  it('does not replace anything if no placeholders found', () => {
    const html = `
      <h1>Native Ad</h1>
      <p>Cool Description</p>
      <a href="http://www.example.com">Click</a>
    `;

    win.document.body.innerHTML = html;
    win.addEventListener = createResponder();

    const nativeAssetManager = newNativeAssetManager(win);
    nativeAssetManager.loadAssets(AD_ID);

    expect(win.document.body.innerHTML).to.equal(html);
  });
});
