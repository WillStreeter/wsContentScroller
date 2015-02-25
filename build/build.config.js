'use strict';

//basic configuration object used by gulp tasks
module.exports = {
  port: 3000,
  tmp: 'build/tmp',
  dist: 'build/dist',
  base: 'client',
  tpl: 'client/src/**/*.tpl.html',
  mainScss: 'client/scss/main.scss',
  fonts:'client/vendor/bootstrap-sass/assets/fonts/**/*',
  scss: 'client/scss/**/*.scss',
  js: [
    'client/src/**/*.js',
    '!client/vendor/**/*.js',
    'client/test/unit/**/*.js'
  ],
  compressjs:[
    'client/src/app/*.js',
    'client/src/common/**/*.js'
  ],
  index:  'client/index.html',
  assets: 'client/assets/**',
  images: 'client/assets/images/**/*',
  banner: ['/**',
    ' * <%= pkg.name %> - <%= pkg.description %>',
    ' * @version v<%= pkg.version %>',
    ' * @link <%= pkg.homepage %>',
    ' * @license <%= pkg.license %>',
    ' */',
    ''
  ].join('\n')
};
