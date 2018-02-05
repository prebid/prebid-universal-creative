'use strict';

var gulp = require('gulp');
var argv = require('yargs').argv;
var connect = require('gulp-connect');
var header = require('gulp-header');
var creative = require('./package.json');
var uglify = require('gulp-uglify');
var clean = require('gulp-clean');

var dateString = 'Updated : ' + (new Date()).toISOString().substring(0, 10);
var banner = '/* <%= creative.name %> v<%= creative.version %>\n' + dateString + ' */\n';
var port = 9999;

gulp.task('clean', function () {
  return gulp.src(['dist/'], {
      read: false
    })
    .pipe(clean());
});

gulp.task('build', ['clean'], () => {
  return gulp.src(['./src/creative.js'])
    .pipe(uglify())
    .pipe(header(banner, { creative: creative }))
    .pipe(gulp.dest('dist'));
});

gulp.task('serve', () => {
  connect.server({
    https: argv.https,
    port: port,
    root: './',
    livereload: true
  });
});

