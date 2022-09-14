export const mocks = {
  createFakeWindow: function (href) {
    return {
      addEventListener: function () {},
      removeEventListener: function () {},
      document: {
        head: {},
        body: {
          style: {}
        }
      },
      location: {
        href: href,
      },
      parent: {},
      top: {},
    };
  }
}
