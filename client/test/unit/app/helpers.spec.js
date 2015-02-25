/*jshint undef:false*/
'use strict';

  describe('jqlite helpers', function() {
    var $rootScope, compiledVerticalScrollContainer, compiledHorizontalScrollContainer,
        incrementObject, incrementVerticalHoldObj, incrementHorizontalHoldObj, $document,
         containerVerticalElement, containerHorizontalElement, $q, $timeout,myPromise;

    var flag = false;

    $document = angular.element(document);

    function testAsync(done) {
      // Wait one seconds, then set the flag to true
      setTimeout(function () {
        flag = true;
        // Invoke the special done callback
        done();
      }, 1000);
    }

    beforeEach(module('wsContentScroller'));
    beforeEach(module('ws.scrollHelpers'));
    beforeEach(function() {
      module('common.services.ws.requestanimation');
      module('common.services.ws.scrollContainerAPI');
      module('common.directives.ws.scrollContainer');
    });
     beforeEach(inject(function(_$q_, _$timeout_, _$rootScope_) {
      // Set `$q` and `$timeout` before tests run
      $q = _$q_;
      $timeout = _$timeout_;
      $rootScope = _$rootScope_;
    }));
    describe('vertical scroll capabiliites', function() {
      var duration = 100;
      angular.element($document[0].body).html('');
      beforeEach(function (done) {
        // Make an async call, passing the special done callback
        flag = false;
        testAsync(done);
      });

      it('should return vertical increment Object with false deactive value', inject(function($document, $rootScope, $compile, wsSrollContainerAPI) {
        containerVerticalElement = angular.element('<div id="myVerticalContainer" ws-scroll-container></div>')[0];
        angular.element($document[0].body).append(containerVerticalElement);
        containerVerticalElement.style.height = '400px';
        containerVerticalElement.style.overflow = 'auto';
        var scrollElement= angular.element('<div >Lorem ipsum...</div>')[0];
        //Find the correct body element
        angular.element(containerVerticalElement).append(scrollElement);
        scrollElement.style.height = '1600px';
        expect(scrollElement.clientHeight).not.toBe(0);
        compiledVerticalScrollContainer = $compile(containerVerticalElement)($rootScope);
        // run a digest loop
        $rootScope.$digest();
        wsSrollContainerAPI.setContainer($rootScope, compiledVerticalScrollContainer);

        incrementObject = compiledVerticalScrollContainer.wsScrollYIncrement('down', 0.4)
        expect(compiledVerticalScrollContainer).toEqual(jasmine.any(Object));
        expect(Object.keys(incrementObject)).toEqual(['incrementValue', 'deactivate']);
        //40% of 400
        expect(incrementObject.incrementValue).toEqual(160);
      }));


      it('single CLICK DOWN should return promise ', function( done) {
        var deferred = $q.defer();
        myPromise = compiledVerticalScrollContainer.wsScrollToAnimated(0, incrementObject.incrementValue, duration, false);
        expect(myPromise).toEqual(jasmine.any(Object));
        expect(Object.keys(myPromise)).toEqual(Object.keys(deferred.promise));
        spyOn(myPromise, 'then');
        $rootScope.$digest();
        $timeout(function() {
          deferred.resolve('test-click-down');
        }, 1000);
        deferred.promise.then(function(value) {
          // Tests set within `then` function of promise
          expect(value).toBe('test-click-down');
        }).finally(done);
        $timeout.flush();
        expect(myPromise.then).toHaveBeenCalled();
      });

      it('single CLICK DOWN have moved from 0 to 160 ', function(){
        expect(compiledVerticalScrollContainer[0].scrollTop).toEqual(160);
      });


      it('single CLICK DOWN cancel while animating should cancel 800 reset position to 350', function(done){

            inject(function( $rootScope) {
              var rejected = false;
              compiledVerticalScrollContainer.wsScrollToAnimated(0, 800, duration , false)
                .catch(function() {
                  rejected = true;
                })
                .finally(function() {
                  expect(rejected).toEqual(true);
                  done();
                });
              compiledVerticalScrollContainer.wsScrollToAnimated(0, 350, duration, false);
              $rootScope.$digest();
            });
      });


      it('position after cancel scrollTop should = 350 ', function(done) {
        done();
        expect(flag).toEqual(false);
        expect(compiledVerticalScrollContainer[0].scrollTop).toEqual(350);
      });


      it('single HOLD DOWN Set Measurements for bottom ', function(){
        incrementVerticalHoldObj = compiledVerticalScrollContainer.wsScrollYIncrementFull('down');
        expect(compiledVerticalScrollContainer).toEqual(jasmine.any(Object));
        expect(Object.keys(incrementVerticalHoldObj)).toEqual(['incrementValue', 'duration']);
        expect(incrementVerticalHoldObj.incrementValue).toEqual(compiledVerticalScrollContainer[0].scrollHeight);
      });

      it('single HOLD DOWN scroll to bottom', function(){
          inject(function( $rootScope) {
            compiledVerticalScrollContainer.wsScrollToAnimated(0, incrementVerticalHoldObj.incrementValue, duration, false);
            $rootScope.$digest();
            expect(flag).toEqual(true);
          });
      });


      it('single HOLD DOWN scroll to bottom (scrollHeight - clientHeight) should equal scrollTop ', function() {
        expect(compiledVerticalScrollContainer[0].scrollHeight - containerVerticalElement.clientHeight).toEqual(compiledVerticalScrollContainer[0].scrollTop);
      });
    });


    describe('horizontal scroll capabiliites', function() {
      var duration = 100;
      angular.element($document[0].body).html('');
      beforeEach(function (done) {
        // Make an async call, passing the special done callback
        flag=false;
        testAsync(done);
      });

      it('should return horizontal increment Object with false deactive value', inject(function($document, $rootScope, $compile, wsSrollContainerAPI) {
        containerHorizontalElement = angular.element('<div id="myHorizontalContainer" ws-scroll-container></div>')[0];
        angular.element($document[0].body).append(containerHorizontalElement);
        containerHorizontalElement.style.width = '400px';
        containerHorizontalElement.style.overflow = 'auto';
        var scrollElement= angular.element('<div >Lorem ipsum...</div>')[0];
        //Find the correct body element
        angular.element(containerHorizontalElement).append(scrollElement);
        scrollElement.style.width = '1600px';
        expect(scrollElement.clientWidth).not.toBe(0);
        compiledHorizontalScrollContainer = $compile(containerHorizontalElement)($rootScope);
        // run a digest loop
        $rootScope.$digest();
        wsSrollContainerAPI.setContainer($rootScope, compiledHorizontalScrollContainer);

        incrementObject = compiledHorizontalScrollContainer.wsScrollXIncrement('right', 0.4);
        expect(compiledHorizontalScrollContainer).toEqual(jasmine.any(Object));
        expect(Object.keys(incrementObject)).toEqual(['incrementValue', 'deactivate']);
        //40% of 400
        expect(incrementObject.incrementValue).toEqual(160);
      }));


      it('single CLICK RIGHT should return promise ', function( done) {
        var deferred = $q.defer();
        myPromise = compiledHorizontalScrollContainer.wsScrollToAnimated( incrementObject.incrementValue,  0, duration, false);
        expect(myPromise).toEqual(jasmine.any(Object));
        expect(Object.keys(myPromise)).toEqual(Object.keys(deferred.promise));
        spyOn(myPromise, 'then');
        $rootScope.$digest();
        $timeout(function() {
          deferred.resolve('test-click-down');
        }, 1000);
        deferred.promise.then(function(value) {
          // Tests set within `then` function of promise
          expect(value).toBe('test-click-down');
        }).finally(done);
        $timeout.flush();
        expect(myPromise.then).toHaveBeenCalled();
      });

      it('single CLICK RIGHT have moved from 0 to 160 ', function(){
        expect(compiledHorizontalScrollContainer[0].scrollLeft).toEqual(160);
      });

      it('single CLICK RIGHT cancel while animating 350 should cancel 800 reset', function(done){

        inject(function( $rootScope) {
          var rejected = false;
          compiledHorizontalScrollContainer.wsScrollToAnimated( 800, 0, duration , false)
            .catch(function() {
              rejected = true;
            })
            .finally(function() {
              expect(rejected).toEqual(true);
              done();
            });
          compiledHorizontalScrollContainer.wsScrollToAnimated( 500, 0, duration, false);
          $rootScope.$digest();
        });
      });


      it('position after cancel scrollLeft should = 500 ', function(done) {
        done();
        expect(flag).toEqual(false);
        expect(compiledHorizontalScrollContainer[0].scrollLeft).toEqual(500);
      });


      it('single HOLD DOWN Set Measurements for right ', function(){
        incrementHorizontalHoldObj = compiledHorizontalScrollContainer.wsScrollXIncrementFull('right');
        expect(compiledHorizontalScrollContainer).toEqual(jasmine.any(Object));
        expect(Object.keys(incrementHorizontalHoldObj)).toEqual(['incrementValue', 'duration']);
        expect(incrementHorizontalHoldObj.incrementValue).toEqual(compiledHorizontalScrollContainer[0].scrollWidth);
      });

      it('single HOLD DOWN scroll to bottom', function(){
        inject(function( $rootScope) {
          compiledHorizontalScrollContainer.wsScrollToAnimated(incrementHorizontalHoldObj.incrementValue, 0,  duration, false);
          $rootScope.$digest();
          expect(flag).toEqual(true);
        });
      });


      it('single HOLD DOWN scroll to bottom (scrollWidth - clientWidth) should equal scrollTop ', function() {
        expect(compiledHorizontalScrollContainer[0].scrollWidth - containerHorizontalElement.clientWidth).toEqual(compiledHorizontalScrollContainer[0].scrollLeft);
      });
    });

 });

