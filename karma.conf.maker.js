const _ = require('lodash');
const webpackConf = require('./webpack.conf');
const karmaConstants = require('karma').constants;
const path = require('path');

function setBrowsers(karmaConf, browserstack) {
  if (browserstack) {
    karmaConf.browserStack = {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY,
      build: 'PUC Unit Tests ' + new Date().toLocaleString()
    }
    karmaConf.customLaunchers = require('./browsers.json')
    karmaConf.browsers = Object.keys(karmaConf.customLaunchers);
  }
}

function setReporters(karmaConf, codeCoverage, browserstack) {
  // In browserstack, the default 'progress' reporter floods the logs.
  // The karma-spec-reporter reports failures more concisely
  if (browserstack) {
    karmaConf.reporters = ['spec'];
    karmaConf.specReporter = {
      maxLogLines: 100,
      suppressErrorSummary: false,
      suppressSkipped: false,
      suppressPassed: true
    };
  }

  if (codeCoverage) {
    karmaConf.reporters.push('coverage-istanbul');
    karmaConf.coverageIstanbulReporter = {
      reports: ['html', 'lcovonly', 'text-summary'],
      dir: path.join(__dirname, 'build', 'coverage'),
      'report-config': {
        html: {
          subdir: 'karma_html',
          urlFriendlyName: true, // simply replaces spaces with _ for files/dirs
        }
      }
    }
  }
}

function newWebpackConfig(codeCoverage) {
  const webpackConfig = _.cloneDeep(webpackConf);
  webpackConfig.devtool = 'inline-source-map';

  if (codeCoverage) {
    webpackConfig.module.rules.push({
      test: /\.js$/,
      enforce: 'post',
      use: {
        loader: 'istanbul-instrumenter-loader',
        options: { esModules: true }
      },
      exclude: /(node_modules)|(test)|(resources)|(template)|(testpages)/
    });
  }
  return webpackConfig;
}

module.exports = function(codeCoverage, browserstack, watchMode) {
  const webpackConfig = newWebpackConfig(codeCoverage);
  const files = ['test/test_index.js'];

  if (watchMode) {
    files.push('test/helpers/karma-init.js');
  }

  const config = {
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: './',

    plugins: [
      'karma-mocha',
      'karma-chrome-launcher',
      'karma-webpack',
      'karma-chai',
      'karma-sourcemap-loader',
      'karma-sinon',
      'karma-coverage',
      'karma-browserstack-launcher',
      'karma-spec-reporter',
      'karma-mocha-reporter',
      'karma-coverage-istanbul-reporter'
    ],
    webpack: webpackConfig,
    webpackMiddleware: {
      logLevel: 'error'
    },

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon'],

    // list of files / patterns to load in the browser
    files: files,

    // list of files / patterns to exclude
    exclude: [
    ],

    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/test_index.js': [ 'webpack', 'sourcemap' ]
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['mocha'],
    mochaReporter: {
      showDiff: true,
      output: 'minimal'
    },

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: karmaConstants.LOG_INFO,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['ChromeHeadless'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: !watchMode,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity,
    browserDisconnectTimeout: 100000,
    browserDisconnectTolerance: 1, // default 0
    browserNoActivityTimeout: 4 * 60 * 1000, // default 10000
    captureTimeout: 4 * 60 * 1000, // default 60000
  }
  setReporters(config, codeCoverage, browserstack);
  setBrowsers(config, browserstack);
  return config;
}
