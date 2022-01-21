export const mocks = {
  createFakeWindow: function (href) {
    return {
      addEventListener: function () {},
      removeEventListener: function () {},
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
