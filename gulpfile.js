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

var dateString = 'Updated : ' + (new Date()).toISOString().substring(0, 10);
var banner = '/* <%= creative.name %> v<%= creative.version %>\n' + dateString + ' */\n';
var port = 9999;

gulp.task('serve', ['clean', 'build-dev', 'connect']);

gulp.task('build', ['build-prod']);

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
    .pipe(uglify())
    .pipe(header(banner, { creative: creative }))
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

