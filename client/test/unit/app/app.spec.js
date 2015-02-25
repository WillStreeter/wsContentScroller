/* jshint undef:false*/
(function() {
  'use strict';

  describe('wsContentScroller module', function() {
    var module;
    var deps;

    var hasModule = function(m) {
      return deps.indexOf(m) >= 0;
    };

    beforeEach(function() {
      module = angular.module('wsContentScroller');
      deps = module.value('wsContentScroller').requires;
    });

    it('should be registered', function() {
      expect(module).not.toEqual(null);
    });

    it('should have common.services.ws.requestanimation as a dependency', function() {
      expect(hasModule('common.services.ws.requestanimation')).toEqual(true);
    });
    it('should have common.services.ws.debounce as a dependency', function() {
      expect(hasModule('common.services.ws.debounce')).toEqual(true);
    });
    it('should have common.services.ws.polyfill as a dependency', function() {
      expect(hasModule('common.services.ws.polyfill')).toEqual(true);
    });
    it('should have common.services.ws.scrollContainerAPI as a dependency', function() {
      expect(hasModule('common.services.ws.scrollContainerAPI')).toEqual(true);
    });
    it('should have ws.scrollHelpers as a dependency', function() {
      expect(hasModule('ws.scrollHelpers')).toEqual(true);
    });
  });
})();
