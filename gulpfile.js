'use strict';

var config = require('./build/build.config.js');
var karmaConfig = require('./build/karma.config.js');
var protractorConfig = require('./build/protractor.config.js');
var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var ngmin  = require('gulp-ng-annotate');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var pkg = require('./package');
var karma = require('karma').server;
var del = require('del');
var _ = require('lodash');
/* jshint camelcase:false*/
var webdriverStandalone = require('gulp-protractor').webdriver_standalone;
var webdriverUpdate = require('gulp-protractor').webdriver_update;

//update webdriver if necessary, this task will be used by e2e task
gulp.task('webdriver:update', webdriverUpdate);

// run unit tests and watch files
gulp.task('tdd', function(cb) {
  karma.start(_.assign({}, karmaConfig, {
    singleRun: false,
    action: 'watch',
    browsers: ['PhantomJS']
  }), cb);
});

// run unit tests with travis CI
gulp.task('travis', ['build'], function(cb) {
  karma.start(_.assign({}, karmaConfig, {
    singleRun: true,
    browsers: ['PhantomJS']
  }), cb);
});

// optimize images and put them in the dist folder
gulp.task('images', function() {
  return gulp.src(config.images)
    .pipe($.imagemin({
      progressive: true,
      interlaced: true
    }))
    .pipe(gulp.dest(config.dist + '/assets/images'))
    .pipe($.size({
      title: 'images'
    }));
});

//generate angular templates using html2js
gulp.task('templates', function() {
  return gulp.src(config.tpl)
    .pipe($.changed(config.tmp))
    .pipe($.html2js({
      outputModuleName: 'templates',
      base: 'client',
      useStrict: true
    }))
    .pipe($.concat('templates.js'))
    .pipe(gulp.dest(config.tmp))
    .pipe($.size({
      title: 'templates'
    }));
});

//generate css files from scss sources
gulp.task('sass', function() {
  return gulp.src(config.mainScss)
    .pipe($.rubySass())
    .on('error', function(err) {
      console.log(err.message);
    })
    .pipe(gulp.dest(config.tmp))
    .pipe($.size({
      title: 'sass'
    }));
});

//build files for creating a dist release
gulp.task('build:dist', ['clean'], function(cb) {
  runSequence(['jshint', 'build', 'copy', 'copy:fonts', 'copy:assets','compress:dev', 'images', 'test:unit'], 'html', cb);
});

//build files for development
gulp.task('build', ['clean'], function(cb) {
  runSequence(['sass', 'templates'], cb);
});

//generate a minified css files, 2 js file, change theirs name to be unique, and generate sourcemaps
gulp.task('html', function() {
  var assets = $.useref.assets({
    searchPath: '{build,client}'
  });

  return gulp.src(config.index)
    .pipe(assets)
    .pipe($.sourcemaps.init())
    .pipe($.if('**/*main.js', $.ngAnnotate()))
    .pipe($.if('*.js', $.uglify({
      mangle: false
    })))
    .pipe($.if('*.css', $.csso()))
    .pipe($.if(['**/*main.js', '**/*main.css'], $.header(config.banner, {
      pkg: pkg
    })))
    .pipe($.rev())
    .pipe(assets.restore())
    .pipe($.useref())
    .pipe($.revReplace())
    .pipe($.if('*.html', $.minifyHtml({
      empty: true
    })))
    .pipe($.sourcemaps.write())
    .pipe(gulp.dest(config.dist))
    .pipe($.size({
      title: 'html'
    }));
});


//copy fonts in vendor folder to assets
gulp.task('copy:fonts', function() {
  gulp.src(config.base+'/src/vendor/bootstrap-sass/assets/fonts/**/*.{ttf,woff,eof,svg}')
   .pipe(gulp.dest(config.base + '/assets/fonts'))
  .pipe($.size({
    title: 'copy:fonts'
  }));
});

//copy assets in dist folder
gulp.task('copy:assets', function() {
  return gulp.src(config.assets, {
      dot: true
    }).pipe(gulp.dest(config.dist + '/assets'))
    .pipe($.size({
      title: 'copy:assets'
    }));
});

//copy assets in dist folder
gulp.task('copy', function() {
  return gulp.src([
      config.base + '/*',
      '!' + config.base + '/*.html',
      '!' + config.base + '/src',
      '!' + config.base + '/test'
    ]).pipe(gulp.dest(config.dist))
    .pipe($.size({
      title: 'copy'
    }));
});

//clean temporary directories
gulp.task('clean', del.bind(null, [config.dist, config.tmp]));

//lint files
gulp.task('jshint', function() {
  return gulp.src([
    'client/src/app/*.js',
    'client/src/common/**/*.js',
    '!client/vendor/**/*.js',
    '!client/test/unit/**/*.js',
    '!client/test/e2e/**/*.js'])
    .pipe(reload({
      stream: true,
      once: true
    }))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe($.if(!browserSync.active, $.jshint.reporter('fail')));
});

/* tasks supposed to be public */


//default task
gulp.task('default', ['serve']); //

//run unit tests and exit
gulp.task('test:unit', ['build'], function(cb) {
  karma.start(_.assign({}, karmaConfig, {
    singleRun: false,
    action: 'run'
  }), cb);
});

// Run e2e tests using protractor, make sure serve task is running.
gulp.task('test:e2e', ['webdriver:update'], function() {
  return gulp.src(protractorConfig.config.specs)
    .pipe($.protractor.protractor({
      configFile: 'build/protractor.config.js'
    }))
    .on('error', function(e) {
      throw e;
    });
});

//run the server,  watch for file changes and redo tests.
gulp.task('serve:tdd', function(cb) {
  runSequence(['serve', 'tdd'], cb);
});

//run the server after having built generated files, and watch for changes
gulp.task('serve', ['build',  'compress:dev'], function() {
  browserSync({
    notify: false,
    logPrefix: pkg.name,
    server: ['build', 'client']
  });

  gulp.watch(config.html, reload);
  gulp.watch(config.scss, ['sass', reload]);
  gulp.watch(config.js, ['jshint']);
  gulp.watch(config.tpl, ['templates', reload]);
  gulp.watch(config.assets, reload);
});


gulp.task('compress:dev', function() {
  //Development version
  gulp.src(config.compressjs)
    .pipe($.concat('ws-angular-content-scroller.js', {newLine: '\n\n'}))
    .pipe(ngmin())
    .pipe(gulp.dest('./build/tmp'))
    .pipe(gulp.dest('./dist'));
});

gulp.task('compress:prod', function() {
  //Minified version
  gulp.src('dist/ws-angular-content-scroller.js')
    .pipe($.sourcemaps.init())
    .pipe($.concat('ws-angular-content-scroller.min.js', { newLine: '\n\n' }))
    .pipe(ngmin())
    .pipe($.uglify())
    .pipe($.sourcemaps.write('./maps'))
    .pipe(gulp.dest('./dist'));
});


//run the app packed in the dist folder
gulp.task('serve:dist', ['build:dist'], function() {
  browserSync({
    notify: false,
    server: [config.dist]
  });
});
