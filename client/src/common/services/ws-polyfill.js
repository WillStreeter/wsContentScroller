//Adapted from https://gist.github.com/paulirish/1579671
angular.module('common.services.ws.polyfill', [])
  .factory('wsPolyfill', function($window) {
    'use strict';

    var vendors = ['webkit', 'moz', 'o', 'ms'];

    return function(fnName, fallback) {
      if($window[fnName]) {
        return $window[fnName];
      }
      var suffix = fnName.substr(0, 1).toUpperCase() + fnName.substr(1);
      for( var i = 0; i < vendors.length; i++) {
        var key = vendors[i]+suffix;
        if($window[key]) {
          return $window[key];
        }
      }
      return fallback;
    };
  });

