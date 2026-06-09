var creative = require('./package.json');
var path = require('path');

module.exports = {
  mode: 'none',
  target: ['web', 'es5'],
  devtool: 'source-map',
  resolve: {
    modules: [
      path.resolve('.'),
      'node_modules'
    ],
  },
  output: {
  },
  optimization: {
    usedExports: true
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: path.resolve('./node_modules'), // required to prevent loader from choking non-Prebid.js node_modules
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env']
            }
          }
        ]
      },
      {
        test: /\.js$/,
        include: /(src|test|testpages)/,
        loader: 'string-replace-loader',
        options: {
          search: '$$PREBID_GLOBAL$$',
          replace: creative.globalVarName,
          flags: 'g'
        }
      }
    ]
  }
};
