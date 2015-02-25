
var wsScrollDefaultEasing = function (x) {
  'use strict';

  if(x < 0.5) {
    return Math.pow(x*2, 2)/2;
  }
  return 1-Math.pow((1-x)*2, 2)/2;
};

(function() {
  'use strict';

  angular.module('wsContentScroller', [
      'common.services.ws.polyfill',
      'common.services.ws.debounce',
      'common.services.ws.requestanimation',
      'common.services.ws.scrollContainerAPI',
      'ws.scrollHelpers',
      'common.directives.ws.scrollControls',
      'common.directives.ws.scrollContainer'
    ])
    //Default easing function for scroll animation
    .value('wsScrollDuration', 350)
    .value('wsScrollEasing', wsScrollDefaultEasing);
})();
