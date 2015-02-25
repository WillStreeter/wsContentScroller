'use strict';

var baseDir = 'client';

var testFiles = [
  baseDir + '/vendor/angular/angular.js',
  baseDir + '/vendor/angular-mocks/angular-mocks.js',
  baseDir + '/vendor/angular-ui-router/release/angular-ui-router.js',
  baseDir + '/src/app/app.js',
  baseDir + '/src/app/helpers.js',
  baseDir + '/src/common/**/*.js',
  'build/tmp/*.js',
  baseDir + '/test/unit/**/*.spec.js'
];


module.exports = {

  //This is the list of file patterns to load into the browser during testing.


  //used framework
  frameworks: ['jasmine'],
  files:testFiles,
  plugins: [
    'karma-chrome-launcher',
    'karma-phantomjs-launcher',
    'karma-jasmine',
    'karma-coverage',
    'karma-html-reporter',
    'karma-mocha-reporter'
  ],

  preprocessors: {
    '**/client/src/**/*.js': 'coverage'
  },

  reporters: ['mocha', 'html'],

  coverageReporter: {
    type: 'html',
    dir: baseDir + '/test/unit-results/coverage',
    file: 'coverage.html'
  },

  htmlReporter: {
    outputDir: baseDir + '//test/unit-results/html'
  },

  logLevel: 'info',

  urlRoot: '/__test/',

  //used browsers (overriding in some gulp task)
  browsers : ['Chrome'],
  customLaunchers: {
    Chrome_travis_ci: {
      base: 'Chrome',
      flags: ['--no-sandbox']
    }
  }
};

module.exports.testFiles = testFiles;
