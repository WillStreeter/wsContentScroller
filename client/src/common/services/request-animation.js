angular.module('common.services.ws.requestanimation', ['common.services.ws.polyfill'])
  .factory('wsRequestAnimation', function(wsPolyfill, $timeout) {
    'use strict';

    var lastTime = 0;
    var fallback = function(callback) {
      var currTime = new Date().getTime();
      var timeToCall = Math.max(0, 16 - (currTime - lastTime));
      var id = $timeout(function() { callback(currTime + timeToCall); },
        timeToCall);
      lastTime = currTime + timeToCall;
      return id;
    };

    return wsPolyfill('requestAnimationFrame', fallback);
  })
  .factory('cancelAnimation', function(wsPolyfill, $timeout) {
    'use strict';

    var fallback = function(promise) {
      $timeout.cancel(promise);
    };

    return wsPolyfill('cancelAnimationFrame', fallback);
  });
