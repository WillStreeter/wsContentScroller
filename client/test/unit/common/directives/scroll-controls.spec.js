/*jshint undef:false*/
'use strict';

describe('unit test for common.directives.ws.scrollControls', function(){
  var flag = false;
  var  $document;
  $document = angular.element(document);
  angular.element($document[0].body).empty();
  function testAsync(done) {
    // Wait two seconds, then set the flag to true
    setTimeout(function () {
      flag = true;
      // Invoke the special done callback
      done();
    }, 2000);

    // Return the deferred promise
    //  return myDefer.promise();
  }

  beforeEach(module('wsContentScroller'));
  beforeEach(function() {
    module('ws.scrollHelpers');
    module('common.services.ws.debounce');
    module('common.services.ws.scrollContainerAPI');
  });

  describe('wsScrollControls', function() {

    var containerElement, controlsElement, scope, controller, compiledContainer, incrementObject, $rootScope;
    var duration = 100;

    angular.element($document[0].body).empty();
    beforeEach(function (done) {
      // Make an async call, passing the special done callback
      flag=false;
      testAsync(done);
    });

    it('should correctly identify value of directive scope attribute scroll-targtet',inject(function ($document, $compile, $rootScope){
      angular.element($document[0].body).empty();
      scope = $rootScope.$new();
      containerElement = angular.element('<div id="verticalContainer" ws-scroll-container></div>')[0];
      angular.element($document[0].body).append(containerElement);
      containerElement.style.height   = '400px';
      containerElement.style.overflow = 'auto';
      var scrollElement= angular.element('<div>SCrOLLL CONTENT.</div>')[0];
      //Find the correct body element
      scrollElement.style.height = '2600px';
      angular.element(containerElement).append(scrollElement);
      compiledContainer =  $compile(containerElement)(scope);
      controlsElement = angular.element('<div  ws-scroll-controls inc-prcnt="30"  duration="800" scroll-target="verticalContainer"> </div>');
      angular.element($document[0].body).append(controlsElement);
      $compile(controlsElement)(scope);
      $rootScope.$digest();
      controller = controlsElement.controller('wsScrollControls');
      scope = controlsElement.isolateScope() || controlsElement.scope();
      expect(scope.scrollTarget).toEqual('verticalContainer');
    }));

    it('should have a controller with a defined container attribute', function() {
      expect(controller.container).toBeDefined();
    });

    it('should correctly $emit event event when emitScrollControlsActiveState function called ', function() {
      // arrange
      spyOn(scope, '$emit');
      // act
      scope.$apply(function() {
        controller.setControlsDeActiveState(false, 'up');
        controller.emitScrollControlsActiveState();
      });
      // assert
      expect(scope.$emit).toHaveBeenCalledWith( 'scroll-controls:activeState', Object({ state: false, direction: 'up' }) );
    });

    it('should receive event scrollMoveRequested ', function(done) {
      incrementObject = compiledContainer.wsScrollYIncrement('down', 0.3);
      inject(function( $rootScope) {
        controller.scrollMoveRequested('down', false, null);
        $rootScope.$digest();
        done();
        expect(flag).toEqual(false);
      });
    });

    it('scrollTop should  equal incrementObject.value',function(){
      console.log('compiledContainer[0].scrollTop ='+compiledContainer[0].scrollTop);
      console.log('incrementObject.incrementValue ='+incrementObject.incrementValue);
      expect(compiledContainer[0].scrollTop).toEqual(incrementObject.incrementValue );
    });
  });
});
