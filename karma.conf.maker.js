var _ = require('lodash');
var webpackConf = require('./webpack.conf');
var karmaConstants = require('karma').constants;

function setBrowsers(karmaConf, browserstack, watchMode) {
  if (browserstack) {
    karmaConf.browserStack = {
      username: process.env.BROWSERSTACK_USERNAME,
      accessKey: process.env.BROWSERSTACK_ACCESS_KEY
    }
    karmaConf.customLaunchers = require('./browsers.json')
    karmaConf.browsers = Object.keys(karmaConf.customLaunchers);
  } else if (watchMode) {
    karmaConf.browsers = ['Chrome'];
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
    karmaConf.coverageReporter = {
      reporters:[
        {
          type : 'html',
          dir : 'coverage/',
          subdir: '.'
        }, 
        {
          type: 'text-summary'
        }
      ]
    }
  }
}

module.exports = function(codeCoverage, browserstack, watchMode) {
  let webpackConfig = _.cloneDeep(webpackConf);
  webpackConfig.devtool = 'inline-source-map';

  let files = ['test/test_index.js'];
  if (watchMode) {
    files.push('test/helpers/karma-init.js');
  }

  let config = {
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
      'karma-mocha-reporter'
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
    reporters: ['progress', 'coverage'],

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
  setBrowsers(config, browserstack, watchMode);
  return config;
}
