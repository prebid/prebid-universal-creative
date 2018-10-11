'use strict';

var _ = require('lodash');
var gulp = require('gulp');
var argv = require('yargs').argv;
var connect = require('gulp-connect');
var header = require('gulp-header');
var creative = require('./package.json');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');
var webpackStream = require('webpack-stream');
var webpack = require('webpack');
var webpackConfig = require('./webpack.conf');
var inject = require('gulp-inject');
var rename = require('gulp-rename');
var KarmaServer = require('karma').Server;
var opens = require('open');
var karmaConfMaker = require('./karma.conf.maker');

var dateString = 'Updated : ' + (new Date()).toISOString().substring(0, 10);
var banner = '/* <%= creative.name %> v<%= creative.version %>\n' + dateString + ' */\n';
var port = 9990;

gulp.task('serve', ['clean', 'test', 'build-dev', 'connect']);

gulp.task('build', ['build-prod', 'build-cookie-sync']);

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
  var cloned = _.cloneDeep(webpackConfig);
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

gulp.task('build-cookie-sync', () => {
  var cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;

  var target = gulp.src('resources/load-cookie.html');
  var sources = gulp.src(['src/cookieSync.js'])
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
  connect.server({
    https: argv.https,
    port: port,
    root: './',
    livereload: true
  });
});

// Run the unit tests.
//
// By default, this runs in headless chrome.
//
// If --watch is given, the task will open the karma debug window 
// If --browserstack is given, it will run the full suite of currently supported browsers.
gulp.task('test', (done) => {
  var karmaConf = karmaConfMaker(false, argv.browserstack, argv.watch);
  new KarmaServer(karmaConf, newKarmaCallback(done)).start();
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
  var coveragePort = 1999;

  connect.server({
    port: coveragePort,
    root: 'coverage/',
    livereload: false
  });
  opens('http://localhost:' + coveragePort);
});

