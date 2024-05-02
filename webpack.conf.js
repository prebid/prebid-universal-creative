var creative = require('./package.json');
var StringReplacePlugin = require('string-replace-webpack-plugin');
var path = require('path');
const ShakePlugin = require('webpack-common-shake').Plugin;

module.exports = {
  devtool: 'source-map',
  resolve: {
    modules: [
      path.resolve('.'),
      'node_modules'
    ],
  },
  output: {
    filename: 'creative.js',
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
        loader: StringReplacePlugin.replace({
          replacements: [
            {
              pattern: /\$\$PREBID_GLOBAL\$\$/g,
              replacement: function (match, p1, offset, string) {
                return creative.globalVarName;
              }
            }
          ]
        })
      }
    ]
  },
  plugins: [new ShakePlugin()],
};
