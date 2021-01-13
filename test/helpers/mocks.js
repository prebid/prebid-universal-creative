export const mocks = {
  createFakeWindow: function (href) {
    return {
      document: {
        head: {},
        body: {}
      },
      location: {
        href: href,
      },
      parent: {},
      top: {}
    };
  }
}