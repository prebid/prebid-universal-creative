export const mocks = {
  createFakeWindow: function (href) {
    return {
      document: {
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