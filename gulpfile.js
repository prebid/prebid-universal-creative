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
var karmaConf = require('./karma.conf.js');

var dateString = 'Updated : ' + (new Date()).toISOString().substring(0, 10);
var banner = '/* <%= creative.name %> v<%= creative.version %>\n' + dateString + ' */\n';
var port = 9999;

gulp.task('serve', ['clean', 'build-dev', 'connect']);

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

gulp.task('test', (done) => {
  new KarmaServer({
    configFile: __dirname + '/karma.conf.js',
  }, newKarmaCallback(done)).start();
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

