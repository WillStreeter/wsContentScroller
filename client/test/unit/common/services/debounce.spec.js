'use strict';

describe('unit test for ws.debounce', function(){

  beforeEach(module('common.services.ws.debounce'));

  describe('wsDebounce Test', function() {
    var debounce, $timeout;
    beforeEach(function () {
      inject(function (_wsDebounce_, _$timeout_) {
        debounce = _wsDebounce_;
        $timeout = _$timeout_;
      });
    });

    it('should invoke callback after specified delay', function () {
      var spy = jasmine.createSpy('debounceFunc');
      debounce(spy, 100, false)();
      expect(spy).not.toHaveBeenCalled();
      $timeout.flush(100);
      expect(spy).toHaveBeenCalled();
    });

    it('should invoke callback immediately', function () {
      var spy = jasmine.createSpy('debounceFunc');
      debounce(spy, 800, true)();
      expect(spy).toHaveBeenCalled();
    });

    it('should wait again if another call arrives during wait', function () {
      var spy = jasmine.createSpy('debounceFunc');
      var debounced = debounce(spy, 100, false);
      debounced();
      $timeout.flush(99);
      debounced();
      $timeout.flush(99);
      expect(spy).not.toHaveBeenCalled();
      $timeout.flush(1);
      expect(spy).toHaveBeenCalled();
    });

  });
});
