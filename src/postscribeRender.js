import postscribe from 'postscribe';

export function writeAdHtml(markup) {
    postscribe(document.body, markup, {
      error: console.error
    });
  }
  