'use strict';

const _ = require('lodash');
const gulp = require('gulp');
const argv = require('yargs').argv;
const webserver = require('gulp-webserver');
const header = require('gulp-header');
const creative = require('./package.json');
const uglify = require('gulp-uglify');
const clean = require('gulp-clean');
const webpackStream = require('webpack-stream');
const webpack = require('webpack');
const webpackConfig = require('./webpack.conf');
const inject = require('gulp-inject');
const rename = require('gulp-rename');
const KarmaServer = require('karma').Server;
const opens = require('open');
const karmaConfMaker = require('./karma.conf.maker');
const execa = require('execa');
const path = require('path');

const dateString = 'Updated : ' + (new Date()).toISOString().substring(0, 10);
const banner = '/* <%= creative.name %> v<%= creative.version %>\n' + dateString + ' */\n';
const port = 9990;

gulp.task('serve', ['clean', 'test', 'build-dev', 'build-native-dev', 'build-cookie-sync', 'connect', 'watch']);

gulp.task('build', ['build-prod', 'build-cookie-sync', 'build-native']);

gulp.task('clean', () => {
  return gulp.src(['dist/', 'build/'], {
    read: false
  })
    .pipe(clean());
});

gulp.task('build-dev', () => {
  return gulp.src(['src/creative.js'])
    .pipe(webpackStream(webpackConfig))
    .pipe(gulp.dest('build'));
});

gulp.task('build-prod', ['clean'], () => {
  let cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;

  return gulp.src(['src/creative.js'])
    .pipe(webpackStream(cloned))
    .pipe(rename({ extname: '.max.js' }))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header(banner, { creative: creative }))
    .pipe(rename({
      basename: 'creative',
      extname: '.js'
    }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build-native-dev', () => {
  var cloned = _.cloneDeep(webpackConfig);
  cloned.output.filename = 'native-trk.js';

  return gulp.src(['src/nativeTrackers.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
});

gulp.task('build-native', () => {
  var cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;
  cloned.output.filename = 'native-trk.js';

  return gulp.src(['src/nativeTrackers.js'])
    .pipe(webpackStream(cloned))
    .pipe(uglify())
    .pipe(header('/* v<%= creative.version %>\n' + dateString + ' */\n', { creative: creative }))
    .pipe(gulp.dest('dist'));
});

gulp.task('build-cookie-sync', () => {
  let cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;

  let target = gulp.src('resources/load-cookie.html');
  let sources = gulp.src(['src/cookieSync.js'])
    .pipe(webpackStream(cloned))
    .pipe(uglify());

  return target.pipe(inject(sources, {
    starttag: '// cookie-sync start',
    endtag: '// end',
    transform: function (filePath, file) {
      return file.contents.toString('utf8')
    }
  }))
    .pipe(gulp.dest('dist'));
});

gulp.task('connect', () => {
  return gulp.src(".").
    pipe(webserver({
      livereload: true,
      port,
      directoryListing: true,
      open: true,
      https: argv.https
    }));
});

gulp.task('watch', () => {
  gulp.watch(
    ['src/**/*.js', 'test/**/*.js'],
    ['clean', 'test', 'build-dev', 'build-native-dev', 'build-cookie-sync']
  );
});

// Run the unit tests.
//
// By default, this runs in headless chrome.
//
// If --watch is given, the task will open the karma debug window
// If --browserstack is given, it will run the full suite of currently supported browsers.
// If --e2e is given, it will run test defined in ./test/e2e/specs in browserstack
gulp.task('test', ['serve-e2e'], (done) => {
  if (argv.e2e) {
    let wdioCmd = path.join(__dirname, 'node_modules/.bin/wdio');
    let wdioConf = path.join(__dirname, 'wdio.conf.js');
    let wdioOpts = [
      wdioConf
    ];
    return execa(wdioCmd, wdioOpts, { stdio: 'inherit' });
  } else {
    let karmaConf = karmaConfMaker(false, argv.browserstack, argv.watch);
    new KarmaServer(karmaConf, newKarmaCallback(done)).start();
  }
});

gulp.task('serve-e2e', () => {
  if (argv.e2e) {
    return gulp.start('serve');
  }
});

function newKarmaCallback(done) {
  return function (exitCode) {
    if (exitCode) {
      done(new Error('Karma tests failed with exit code ' + exitCode));
    } else {
      done();
    }
  }
}

gulp.task('set-test-node-env', () => {
  return process.env.NODE_ENV = 'test';
});

gulp.task('test-coverage', ['set-test-node-env'], (done) => {
  new KarmaServer(karmaConfMaker(true, false, false), newKarmaCallback(done)).start();
})

gulp.task('view-coverage', () => {
  let coveragePort = 1999;

  return gulp.src("./coverage/").pipe(webserver({
    port: coveragePort,
    open: true
  }));
});
