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

/**
 * This generic function will compile the file specified as inputFile and will
 * generate an output file in the build directory. 
 */
function buildDev({ inputFile, outputFile }) {
  var cloned = _.cloneDeep(webpackConfig);
  cloned.output.filename = outputFile;
  return gulp.src([inputFile])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
}

function buildLegacyDev() {
  return buildDev({ inputFile: 'src/legacy.js', outputFile: 'creative.js' });
}

function buildBannerDev() {
  return buildDev({ inputFile: 'src/creative.js', outputFile: 'banner.js' });
}

function buildVideoDev() {
  return buildDev({ inputFile: 'src/creative.js', outputFile: 'video.js' });
}

function buildAmpDev() {
  return buildDev({ inputFile: 'src/ampOrMobile.js', outputFile: 'amp.js' });
}

function buildMobileDev() {
  return buildDev({ inputFile: 'src/ampOrMobile.js', outputFile: 'mobile.js' });
}

function buildNativeDev() {
  return buildDev({ inputFile: 'src/nativeTrackers.js', outputFile: 'native-trk.js' });
}

function buildNativeRenderDev() {
  return buildDev({ inputFile: 'src/nativeRender.js', outputFile: 'native.js' });
}

function buildNativeRenderLegacyDev() {
  return buildDev({ inputFile: 'src/legacyNativeRender.js', outputFile: 'native-render.js' });
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
  return buildDev({ inputFile: 'src/ssp-userids/uid.js', outputFile: 'uid.js' });
}

function buildProdLegacy() {
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

function includeStaticVastXmlFile() {
  let target = gulp.src('static/prebid-mobile-rewarded-vast.xml');
  return target.pipe(gulp.dest('dist'));
}

function buildProd({ inputFile, outputFile }) {
  let cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;

  return gulp.src([inputFile])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('dist'))
    .pipe(uglify())
    .pipe(header(banner, { creative: creative }))
    .pipe(rename({
      basename: outputFile.split('.')[0],
      extname: `.${outputFile.split('.')[1]}`
    }))
    .pipe(gulp.dest('dist'));
}

function buildBanner() {
  return buildProd({ inputFile: 'src/creative.js', outputFile: 'banner.js' });
}

function buildVideo() {
  return buildProd({ inputFile: 'src/creative.js', outputFile: 'video.js' });
}

function buildAmp() {
  return buildProd({ inputFile: 'src/ampOrMobile.js', outputFile: 'amp.js' });
}

function buildMobile() {
  return buildProd({ inputFile: 'src/ampOrMobile.js', outputFile: 'mobile.js' });
}

function buildNative() {
  return buildProd({ inputFile: 'src/nativeTrackers.js', outputFile: 'native-trk.js' });
}

function buildNativeRender() {
  return buildProd({ inputFile: 'src/nativeRender.js', outputFile: 'native.js' });
}

function buildLegacyNativeRender() {
  return buildProd({ inputFile: 'src/legacyNativeRender.js', outputFile: 'native-render.js' });
}

function buildUid() {
  var cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;
  cloned.output.filename = 'uid.js';

  return gulp.src(['src/ssp-userids/uid.js'])
  .pipe(webpackStream(cloned))
    .pipe(uglify())
    .pipe(header('/* v<%= creative.version %>\n' + dateString + ' */\n', { creative: creative }))
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

  mainWatcher.on('all', gulp.series(clean, gulp.parallel(buildLegacyDev, buildBannerDev, buildVideoDev, buildAmpDev, buildMobileDev, buildNativeRenderLegacyDev, buildNativeDev, buildNativeRenderDev, buildCookieSync, buildCookieSyncWithConsent, buildUidDev, includeStaticVastXmlFile), test));
  done();
}

function openWebPage() {
  return opens(`${(argv.https) ? 'https' : 'http'}://localhost:${port}`);
}

gulp.task('serve', gulp.series(clean, gulp.parallel(buildLegacyDev, buildBannerDev, buildVideoDev, buildAmpDev, buildMobileDev, buildNativeRenderLegacyDev, buildNativeDev, buildNativeRenderDev, buildCookieSync, buildCookieSyncWithConsent, buildUidDev, includeStaticVastXmlFile, watch, test), openWebPage));

gulp.task('build', gulp.parallel(buildProdLegacy, buildLegacyNativeRender, buildBanner, buildVideo, buildCookieSync, buildCookieSyncWithConsent, buildNative, buildNativeRender, buildUid, buildAmp, buildMobile, includeStaticVastXmlFile));

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
