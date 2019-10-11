'use strict';

const _ = require('lodash');
const gulp = require('gulp');
const argv = require('yargs').argv;
const connect = require('gulp-connect');
const open = require('open');
const header = require('gulp-header');
const creative = require('./package.json');
const uglify = require('gulp-uglify');
const del = require('del');
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

gulp.task('clean', () => {
  return del([
    'build/',
    'dist/'
  ]);
});

gulp.task('build-dev', () => {
  return gulp.src(['src/creative.js'])
    .pipe(webpackStream(webpackConfig))
    .pipe(gulp.dest('build'));
});

gulp.task('build-native-dev', () => {
  var cloned = _.cloneDeep(webpackConfig);
  cloned.output.filename = 'native-trk.js';

  return gulp.src(['src/nativeTrackers.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
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

gulp.task('build-uid-dev', () => {
  var cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;
  cloned.output.filename = 'uid.js';

  return gulp.src(['src/ssp-userids/uid.js'])
    .pipe(webpackStream(cloned))
    .pipe(gulp.dest('build'));
});

gulp.task('connect', (done) => {
  const host = argv.host ? argv.host : 'localhost';

  connect.server({
    https: argv.https,
    port: port,
    root: './',
    livereload: true
  });

  open(`http://${host}:${port}`)
    .then(() => done())
    .catch((err) => {
        console.error(`some error occurred, can't open: http://${host}:${port}. ERR:: ${err}`);
        done();
    });
});

gulp.task('build-prod', gulp.series('clean', () => {
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
}));

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

gulp.task('build-uid', () => {
  var cloned = _.cloneDeep(webpackConfig);
  delete cloned.devtool;
  cloned.output.filename = 'uid.js';

  return gulp.src(['src/ssp-userids/uid.js'])
    .pipe(webpackStream(cloned))
    .pipe(uglify())
    .pipe(header('/* v<%= creative.version %>\n' + dateString + ' */\n', { creative: creative }))
    .pipe(gulp.dest('dist'));
});

gulp.task('serve-e2e', (done) => {
  if (argv.e2e) {
    gulp.series('serve');
    done();
  }
  done();
});

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
gulp.task('test', gulp.series('serve-e2e', test));

gulp.task('watch', (done) => {
  gulp.watch(['src/**/*.js', 'test/**/*.js'], gulp.series('clean', gulp.parallel('test', 'build-dev', 'build-native-dev', 'build-cookie-sync', 'build-uid-dev')));
  done();
});

gulp.task('serve', gulp.series('clean', gulp.parallel('test', 'build-dev', 'build-native-dev', 'build-cookie-sync', 'build-uid-dev'), 'connect', 'watch'));

gulp.task('build', gulp.parallel('build-prod', 'build-cookie-sync', 'build-native', 'build-uid'));

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

gulp.task('set-test-node-env', (done) => {
  process.env.NODE_ENV = 'test';
  done();
});

gulp.task('test-coverage', gulp.series('set-test-node-env', (done) => {
  new KarmaServer(karmaConfMaker(true, false, false), newKarmaCallback(done)).start();
}));

gulp.task('view-coverage', (done) => {
  const coveragePort = 1999;
  const host = argv.host ? argv.host : 'localhost';

  connect.server({
    port: coveragePort,
    root: './coverage',
    livereload: false
  });

  open(`http://${host}:${coveragePort}`)
    .then(() => done())
    .catch((err) => {
        console.error(`some error occurred, can't open: http://${host}:${coveragePort}. ERR:: ${err}`);
        done();
    });
});
