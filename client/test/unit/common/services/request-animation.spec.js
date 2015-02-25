'use strict';

describe('service', function() {
  beforeEach(module('wsContentScroller'));

  beforeEach(function() {
    module('common.services.ws.polyfill');
    module('common.services.ws.requestanimation');
  });

  describe('wsRequestAnimation', function() {
    it('should contain an requestAnimation service', inject(function(wsRequestAnimation) {
      expect(wsRequestAnimation).not.toBe(null);
    }));

    describe('callback', function() {
      var timerCallback;
      beforeEach(function() {
        timerCallback = jasmine.createSpy("timerCallback");
      });

      it('should be called within 100ms', function(done){inject(['wsRequestAnimation',function(wsRequestAnimation) {
        wsRequestAnimation(timerCallback);
        expect(timerCallback).not.toHaveBeenCalled();
        setTimeout(function() {
          expect(timerCallback).toHaveBeenCalled();
          done();
        }, 100);
      }])});
    });
  });
});
