'use strict';

const _ = require('lodash');
const gulp = require('gulp');
const argv = require('yargs').argv;
const opens = require('opn');
const header = require('gulp-header');
const connect = require('gulp-connect');
const creative = require('./package.json');
const uglify = require('gulp-uglify');
const gulpClean = require('gulp-clean');
const webpackStream = require('webpack-stream');
const webpackConfig = require('./webpack.conf');
const inject = require('gulp-inject');
const rename = require('gulp-rename');
const KarmaServer = require('karma').Server;
const karmaConfMaker = require('./karma.conf.maker');
const execa = require('execa');
const path = require('path');

const dateString = 'Updated : ' + (new Date()).toISOString().substring(0, 10);
const banner = '/* <%= creative.name %> v<%= creative.version %>\n' + dateString + ' */\n';
const port = 9990;

function clean() {
  return gulp.src(['dist/', 'build/'], {
    read: false,
    allowEmpty: true
  })
    .pipe(gulpClean());
}

function buildDev() {
  var cloned = _.cloneDeep(webpackConfig);
  cloned.output.filename = 'creative.js';
  return gulp.src(['src/legacy.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
}

function buildBannerDev() {
  var cloned = _.cloneDeep(webpackConfig);
  cloned.output.filename = 'banner.js';

  return gulp.src(['src/creative.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
}

function buildVideoDev() {
  var cloned = _.cloneDeep(webpackConfig);
  cloned.output.filename = 'video.js';

  return gulp.src(['src/creative.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
}

function buildAmpDev() {
  var cloned = _.cloneDeep(webpackConfig);
  cloned.output.filename = 'amp.js';

  return gulp.src(['src/ampOrMobile.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
}

function buildMobileDev() {
  var cloned = _.cloneDeep(webpackConfig);
  cloned.output.filename = 'mobile.js';

  return gulp.src(['src/ampOrMobile.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
}

function buildNativeDev() {
  var cloned = _.cloneDeep(webpackConfig);
  cloned.output.filename = 'native-trk.js';

  return gulp.src(['src/nativeTrackers.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
}

function buildNativeRenderDev() {
  var cloned = _.cloneDeep(webpackConfig);
  cloned.output.filename = 'native.js';

  return gulp.src(['src/nativeRender.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
}

function buildNativeRenderLegacyDev() {
  var cloned = _.cloneDeep(webpackConfig);
  cloned.output.filename = 'native-render.js';

  return gulp.src(['src/legacyNativeRender.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
}

function buildCookieSync() {
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
}

function buildCookieSyncWithConsent() {
  let cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;

  let target = gulp.src('resources/load-cookie-with-consent.html');
  let sources = gulp.src(['src/cookieSyncWithConsent.js'])
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
}

function buildUidDev() {
  var cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;
  cloned.output.filename = 'uid.js';

  return gulp.src(['src/ssp-userids/uid.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
}

function buildProd() {
  let cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;

  return gulp.src(['src/legacy.js'])
    .pipe(webpackStream(cloned))
    .pipe(rename({ extname: '.max.js' }))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header('/* v<%= creative.version %>\n' + dateString + '\nDEPRECATED, please use creative based on hb_format targeting */\n', { creative: creative }))
    .pipe(rename({
      basename: 'creative',
      extname: '.js'
    }))
    .pipe(gulp.dest('dist'));
}

function buildBanner() {
  let cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;

  return gulp.src(['src/creative.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header(banner, { creative: creative }))
    .pipe(rename({
      basename: 'banner',
      extname: '.js'
    }))
    .pipe(gulp.dest('dist'));
}

function buildVideo() {
  let cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;

  return gulp.src(['src/creative.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header(banner, { creative: creative }))
    .pipe(rename({
      basename: 'video',
      extname: '.js'
    }))
    .pipe(gulp.dest('dist'));
}

function buildAmp() {
  let cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;

  return gulp.src(['src/ampOrMobile.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header(banner, { creative: creative }))
    .pipe(rename({
      basename: 'amp',
      extname: '.js'
    }))
    .pipe(gulp.dest('dist'));
}

function buildMobile() {
  let cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;

  return gulp.src(['src/ampOrMobile.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header(banner, { creative: creative }))
    .pipe(rename({
      basename: 'mobile',
      extname: '.js'
    }))
    .pipe(gulp.dest('dist'));
}

function buildNative() {
  var cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;
  cloned.output.filename = 'native-trk.js';

  return gulp.src(['src/nativeTrackers.js'])
    .pipe(webpackStream(cloned))
    .pipe(uglify())
    .pipe(header('/* v<%= creative.version %>\n' + dateString + ' */\n', { creative: creative }))
    .pipe(gulp.dest('dist'));
}

function buildNativeRender() {
  var cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;
  cloned.output.filename = 'native.js';

  return gulp.src(['src/nativeRender.js'])
    .pipe(webpackStream(cloned))
    .pipe(uglify())
    .pipe(header(banner, { creative: creative }))
    .pipe(gulp.dest('dist'));
}

function buildLegacyNativeRender() {
  var cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;
  cloned.output.filename = 'native-render.js';

  return gulp.src(['src/legacyNativeRender.js'])
    .pipe(webpackStream(cloned))
    .pipe(uglify())
    .pipe(header(banner, { creative: creative }))
    .pipe(gulp.dest('dist'));
}

function buildUid() {
  var cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;
  cloned.output.filename = 'uid.js';

  return gulp.src(['src/ssp-userids/uid.js'])
  .pipe(webpackStream(cloned))
    .pipe(uglify())
    .pipe(header('/* v<%= creative.version %>\n' + dateString + '\nDEPRECATED, please use creative based on hb_format targeting */\n', { creative: creative }))
    .pipe(gulp.dest('dist'));
}

function includeStaticVastXmlFile() {
  let target = gulp.src('static/prebid-mobile-rewarded-vast.xml');
  return target.pipe(gulp.dest('dist'));
}

// Run the unit tests.
//
// By default, this runs in headless chrome.
//
// If --watch is given, the task will open the karma debug window
// If --browserstack is given, it will run the full suite of currently supported browsers.
// If --e2e is given, it will run test defined in ./test/e2e/specs in browserstack

function test(done) {
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
}

function newKarmaCallback(done) {
  return function(exitCode) {
    if (exitCode) {
      done(new Error('Karma tests failed with exit code' + exitCode));
      if (argv.browserstack) {
        process.exit(exitCode);
      }
    } else {
      done();
      if (argv.browserstack) {
        process.exit(exitCode);
      }
    }
  } 
}

function setupE2E(done) {
  argv.e2e = true;
  done();
}

gulp.task('test', gulp.series(clean, test));

gulp.task('e2e-test', gulp.series(clean, setupE2E, gulp.parallel(buildBannerDev, buildVideoDev, buildAmpDev, buildMobileDev, buildCookieSync, buildCookieSyncWithConsent, buildNativeDev, buildNativeRenderDev, buildUidDev, includeStaticVastXmlFile, watch), test));

function watch(done) {
  const mainWatcher = gulp.watch([
    'src/**/*.js',
    'test/**/*.js'
  ]);

  connect.server({
    https: argv.https,
    livereload: true,
    port,
    root: './'
  });

  mainWatcher.on('all', gulp.series(clean, gulp.parallel(buildBannerDev, buildVideoDev, buildAmpDev, buildMobileDev, buildNativeDev, buildNativeRenderDev, buildCookieSync, buildCookieSyncWithConsent, includeStaticVastXmlFile, buildUidDev), test));
  done();
}

function openWebPage() {
  return opens(`${(argv.https) ? 'https' : 'http'}://localhost:${port}`);
}

gulp.task('serve', gulp.series(clean, gulp.parallel(buildDev, buildBannerDev, buildVideoDev, buildAmpDev, buildMobileDev, buildNativeRenderLegacyDev, buildNativeDev, buildNativeRenderDev, buildCookieSync, buildCookieSyncWithConsent, buildUidDev, includeStaticVastXmlFile, watch, test), openWebPage));

gulp.task('build', gulp.parallel(buildProd, buildLegacyNativeRender, buildBanner, buildVideo, buildCookieSync, buildCookieSyncWithConsent, buildNative, buildNativeRender, buildUid, buildAmp, buildMobile, includeStaticVastXmlFile));

gulp.task('test-coverage', (done) => {
  new KarmaServer(karmaConfMaker(true, false, false), newKarmaCallback(done)).start();
});

gulp.task('view-coverage', (done) => {
  const coveragePort = 1999;
  const localhost = (argv.host) ? argv.host : 'localhost';

  connect.server({
    port: coveragePort,
    root: 'build/coverage/karma_html',
    livereload: false
  });

  opens('http://' + localhost + ':' + coveragePort);
  done();
});
