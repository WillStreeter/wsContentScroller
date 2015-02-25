angular.module('common.directives.ws.scrollControls', ['ws.scrollHelpers', 'common.services.ws.debounce', 'common.services.ws.scrollContainerAPI']);
/* Service Decorators can be configured in `config` blocks */
angular.module('common.directives.ws.scrollControls').config(function ($provide) {
  'use strict';
  //http://stackoverflow.com/questions/23147757/how-to-get-the-status-of-angular-interval-check-if-the-interval-has-been-canc

  /* Register a decorator for the `$interval` service */
  $provide.decorator('$interval', function ($delegate) {

    /* Keep a reference to the original `cancel()` method */
    var originalCancel = $delegate.cancel.bind($delegate);

    /* Define a new `cancel()` method */
    $delegate.cancel = function (intervalPromise) {

      /* First, call the original `cancel()` method */
      var retValue = originalCancel(intervalPromise);


      /* If the promise has been successfully cancelled,
       * add a `cancelled` property (with value `true`) */
      if (retValue && intervalPromise) {
        intervalPromise.cancelled = true;
      }

      /* Return the value returned by the original method */
      return retValue;
    };

    /* Return the original (but 'augmented') service */
    return $delegate;
  });
});

angular.module('common.directives.ws.scrollControls').directive('wsScrollControls',
  ['wsScrollDuration', '$interval', 'wsDebounce', '$timeout','wsSrollContainerAPI',
  function(wsScrollDuration, $interval, wsDebounce, $timeout, wsSrollContainerAPI) {
  'use strict';

  return {
    restrict:'A',
    scope:{
      scrollTarget:'@'
    },
    controller: function($log, $scope, $interval) {
      this.duration                           = null; //duration of animation
      this.container                          = null;
      this.incPrcnt                           = null;
      this.scrollType                         = null;
      this.containerScrollTop                 = 0;
      this.scrollControlsDeactivate           = {};
      this.scrollControlsDeactivate.state     = false;
      this.scrollControlsDeactivate.direction = null;
      var reqFrmBtnTimer                      = null;
      var scrollTimer                         = null;
      var requestFromButton                   = false;
      var INTERVAL_DELAY                      = 50;
      var self                                = this;
      var currentDirection                    = null;

      var tempHoldState                       = false;


      function getIncrement(scrollDirection, deactivateState){
        var  incrementAmtObj = null;
        if(self.scrollType === 'vertical') {
          incrementAmtObj = self.container.wsScrollYIncrement(scrollDirection, self.incPrcnt);
        }else {
          incrementAmtObj = self.container.wsScrollXIncrement(scrollDirection, self.incPrcnt);
        }
        if(incrementAmtObj.deactivate){
          if (scrollTimer && !scrollTimer.cancelled && deactivateState){
            $interval.cancel(scrollTimer);
            self.updateButtonRequestedState();
          }
          self.setControlsDeActiveState( deactivateState, scrollDirection);
          self.emitScrollControlsActiveState();
        }
        return incrementAmtObj;
      }

      function updateScroll(){
        var incrementAmtObj =  getIncrement(currentDirection, true);
        if (!scrollTimer || scrollTimer.cancelled){
          if(self.scrollType  ==='vertical'){
            self.container.wsScrollToAnimated(0, incrementAmtObj.incrementValue, self.duration, false);
          }else{
            self.container.wsScrollToAnimated(incrementAmtObj.incrementValue, 0, self.duration, false);
          }
        }
      }

      function startScrollTimer() {
        if (scrollTimer && !scrollTimer.cancelled) {
          $interval.cancel(scrollTimer);
        }
        //update scroll timer and DeActiveState if applicable
         getIncrement(currentDirection, true);
        if(self.scrollType  === 'horizontal'){
          var incrementXAmtObj =  self.container.wsScrollXIncrementFull(currentDirection);
          tempHoldState = true;
          self.container.wsScrollToAnimated(incrementXAmtObj.incrementValue, 0, incrementXAmtObj.duration, false);
        }else{
          var incrementYAmtObj =  self.container.wsScrollYIncrementFull(currentDirection);
          tempHoldState = true;
          self.container.wsScrollToAnimated( 0, incrementYAmtObj.incrementValue, incrementYAmtObj.duration, false);
        }
        scrollTimer = $interval(updateScroll, INTERVAL_DELAY);
      }

      function stopScrollTimer(){
        self.updateButtonRequestedState();
        if (scrollTimer && !scrollTimer.cancelled) {
          $interval.cancel(scrollTimer);
        }
        if(tempHoldState){
          tempHoldState = false;
          self.container.wsScrollToAnimated(0, 0, 0, false);
          self.setControlsDeActiveState( false, currentDirection);
          self.emitScrollControlsActiveState();
        }
      }

      this.setControlsDeActiveState = function(state, direction){
        this.scrollControlsDeactivate.state     = state;
        this.scrollControlsDeactivate.direction = direction;
      };

      this.updateButtonRequestedState = function(){
       reqFrmBtnTimer = $timeout(function() {
                              $scope.$apply(
                                function () {
                                    requestFromButton = false;
                                });
                            }, (this.duration * 2) );
      };

      this.isButtonRequest = function(){
        return requestFromButton;
      };


      this.emitScrollControlsActiveState = function(){
        $scope.$emit('scroll-controls:activeState',  this.scrollControlsDeactivate);
      };

      this.scrollMoveRequested = function(scrollDirection, hold, scrollStart) {
        if(reqFrmBtnTimer){
          $timeout.cancel(reqFrmBtnTimer);
        }
        requestFromButton = true;

        if (!this.scrollType) {
          if (scrollDirection === 'up' || scrollDirection === 'down') {
            this.scrollType = 'vertical';
          } else {
            this.scrollType = 'horizontal';
          }
        }

        currentDirection = scrollDirection;
        if (this.scrollControlsDeactivate.state && this.scrollControlsDeactivate.direction !== currentDirection) {
          getIncrement(this.scrollControlsDeactivate.direction, false);
        }
        if (hold && ( !scrollTimer || scrollTimer && scrollTimer.cancelled ) && scrollStart) {
          startScrollTimer();
        } else if (hold && (!scrollTimer || scrollTimer && !scrollTimer.cancelled ) && !scrollStart) {
          stopScrollTimer();
        } else if (!hold) {
          $interval.cancel(scrollTimer);
          updateScroll();
          this.updateButtonRequestedState();
        }

      };

      $scope.$on('$destroy', function(){
        $interval.cancel(scrollTimer);
        $timeout.cancel(reqFrmBtnTimer);
      });

    },
    link : function($scope, $element, $attr, controller) {
      var windowSrcollListener = null;
      wsSrollContainerAPI.setContainer($scope, angular.element(document.getElementById($scope.scrollTarget)));
      controller.duration = $attr.duration ? parseInt($attr.duration, 10) : wsScrollDuration;
      controller.container = wsSrollContainerAPI.getContainer($scope);
      if ($attr.incPrcnt && parseInt($attr.incPrcnt, 10) < 100){
        controller.incPrcnt = parseInt($attr.incPrcnt, 10) * 0.01;
      }else{
        controller.incPrcnt = 0.15;
      }
      windowSrcollListener  =  controller.container.on('scroll',
         wsDebounce(function() {
             if(!controller.isButtonRequest()){
                if( (Math.round(controller.container[0].scrollTop) + Math.round(controller.container[0].clientHeight) ) >=  Math.round(controller.container[0].scrollHeight)){
                   controller.setControlsDeActiveState(true, 'down');
                   $scope.$emit('scroll-controls:activeState', controller.scrollControlsDeactivate);
                 }else  if( Math.round(controller.container[0].scrollTop) === 0){
                   controller.setControlsDeActiveState(true, 'up');
                   $scope.$emit('scroll-controls:activeState', controller.scrollControlsDeactivate);
                 } else if(controller.scrollControlsDeactivate.state){
                   if(controller.container[0].scrollTop > controller.containerScrollTop){
                     controller.containerScrollTop = controller.container[0].scrollTop;
                     if(controller.scrollControlsDeactivate.direction === 'up'){
                         controller.setControlsDeActiveState(false, 'up');
                         $scope.$emit('scroll-controls:activeState', controller.scrollControlsDeactivate);
                     }else if(controller.scrollControlsDeactivate.direction === 'down'){
                         controller.setControlsDeActiveState(false, 'down');
                         $scope.$emit('scroll-controls:activeState', controller.scrollControlsDeactivate);
                     }
                   }else if(controller.container[0].scrollTop < controller.containerScrollTop){
                     controller.containerScrollTop = controller.container[0].scrollTop;
                     if(controller.scrollControlsDeactivate.direction === 'down') {
                       controller.setControlsDeActiveState(false, 'down');
                       $scope.$emit('scroll-controls:activeState', controller.scrollControlsDeactivate);
                     }else if(controller.scrollControlsDeactivate.direction === 'up'){
                       controller.setControlsDeActiveState(false, 'up');
                       $scope.$emit('scroll-controls:activeState', controller.scrollControlsDeactivate);
                     }
                   }
                 }
             }
          }, 150, false)
      );
      $scope.$on('$destroy', function(){
        windowSrcollListener();
      });
    }
  };
}]);



angular.module('common.directives.ws.scrollControls').directive('scrollButton', function($interval, $timeout) {
  'use strict';
  var isTouchDevice = !!('ontouchstart' in window);
  return {
    require: '^wsScrollControls',
    restrict: 'A',
    link: function (scope, element, attr, wsScrollControlsCtrl) {
        var scrollButtonUpdateListener   =  null;
        var touchControlsListener        = null;
        var scrollButtonType             =  attr.scrollBtnType;
        var udpateButtonStateTimer       =  null;
        var INTERVAL_DELAY               =  600;
        var clickEventTimer              =  null;
        var downEventTimer               =  null;
        var mouseUp                      =  false;
        var mouseState                   =  {};
        var hasOnClick                   =  null;
        var hasMouseLeave                =  null;
        var hasMouseUp                   =  null;
        mouseState.up    = false;
        mouseState.down  = false;
        mouseState.left  = false;
        mouseState.right  = false;



        function animateScrollRequest( buttonHold, holdScrollStart) {
          if(holdScrollStart===true ||holdScrollStart===false){
               mouseState[scrollButtonType]  = holdScrollStart;
               wsScrollControlsCtrl.scrollMoveRequested(scrollButtonType, buttonHold, holdScrollStart);
          }else{
             if(!mouseState[scrollButtonType]){
               wsScrollControlsCtrl.scrollMoveRequested(scrollButtonType, buttonHold, holdScrollStart);
             }
          }
        }

        function updateButtonState( state, direction){
            if(state && mouseUp){
              unbindMouseUpNLeave();
            }
            udpateButtonStateTimer =  $timeout(function() {
                  scope.$apply(
                    function () {
                        switch(direction) {
                            case 'up':
                                  if(scrollButtonType === direction ){
                                     scope.disableUp = state;
                                  }
                                  if(state && scrollButtonType === 'down'){
                                    scope.disableDown = false;
                                  }
                              break;
                            case 'down':
                                  if(scrollButtonType === direction){
                                      scope.disableDown = state;
                                  }
                                  if(state && scrollButtonType === 'up'){
                                      scope.disableUp = false;
                                  }
                              break;
                            case 'left':
                                  if(scrollButtonType === direction){
                                     scope.disableLeft = state;
                                   }
                                   if(state && scrollButtonType === 'right'){
                                       scope.disableRight = false;
                                   }
                               break;
                            case 'right':
                                  if(scrollButtonType === direction){
                                     scope.disableRight = state;
                                  }
                                  if(state && scrollButtonType === 'left'){
                                     scope.disableLeft = false;
                                  }
                                break;
                        }
                });
            }, 0);
        }
        function getButtonDisableState(direction){
            var state = false;
            switch(direction) {
              case 'up':
                state = scope.disableUp;
                break;
              case 'down':
                state = scope.disableDown;
                break;
              case 'left':
                state = scope.disableLeft;
                break;
              case 'right':
                state = scope.disableRight;
                break;
            }
            return state;
        }

        scrollButtonUpdateListener = scope.$on('scroll-controls:activeState', function(event, scrollDeActivateState){
            updateButtonState(scrollDeActivateState.state, scrollDeActivateState.direction);
            if(!scrollDeActivateState.state && scrollDeActivateState.direction === scrollButtonType){
              mouseState[scrollDeActivateState.direction ] = scrollDeActivateState.state;
            }
        });


        function doMouseHoldSetUp(){
          if(!mouseState[scrollButtonType] && !mouseUp && !getButtonDisableState(scrollButtonType)) {
            $interval.cancel(clickEventTimer);
            $interval.cancel(downEventTimer);
            mouseUp = true;
            if(hasOnClick){
              element.off('click');
              hasOnClick = null;
            }
            animateScrollRequest(true, true);
          }
        }

        function doClickBind(){
          if(!hasOnClick) {
            hasOnClick = element.on('click', function (e) {
              if (e.stopPropagation) {
                e.stopPropagation();
              }
              if (e.preventDefault) {
                e.preventDefault();
              }
              if (!mouseState[scrollButtonType] && !mouseUp && !getButtonDisableState(scrollButtonType)) {
                $interval.cancel(downEventTimer);
                $interval.cancel(clickEventTimer);
                animateScrollRequest(false, null);
              }
            });
          }
        }


        function rebindMouseClick(){
          if (clickEventTimer && !clickEventTimer.cancelled) {
            $interval.cancel(clickEventTimer);
          }

          unbindMouseUpNLeave();
          if(!hasOnClick){
            clickEventTimer = $interval(doClickBind, INTERVAL_DELAY);
          }
        }


        function mouseHoldDownTimerStart(){
          if (downEventTimer && !downEventTimer.cancelled) {
            $interval.cancel(downEventTimer);
          }
          bindMouseLeaveNUp();
          downEventTimer = $interval(doMouseHoldSetUp, INTERVAL_DELAY);
        }


        //function for mouse Event Ending a hold event...
        function bindMouseLeaveNUp(){
          if(!hasMouseLeave){
            hasMouseLeave =  element.on('mouseleave', function(e) {
              if (e.stopPropagation) {
                e.stopPropagation();
              }
              if (e.preventDefault) {
                e.preventDefault();
              }
              $interval.cancel(clickEventTimer);
              $interval.cancel(downEventTimer);
              if (mouseState[scrollButtonType] && mouseUp && !getButtonDisableState(scrollButtonType)) {
                animateScrollRequest(true, false);
                rebindMouseClick();
              }

            });
          }


          if(!hasMouseUp) {
            hasMouseUp = element.on('mouseup', function (e) {
              if (e.stopPropagation) {
                e.stopPropagation();
              }
              if (e.preventDefault) {
                e.preventDefault();
              }
              $interval.cancel(clickEventTimer);
              $interval.cancel(downEventTimer);
              if (mouseState[scrollButtonType] && mouseUp && !getButtonDisableState(scrollButtonType)) {
                animateScrollRequest(true, false);
                rebindMouseClick();
              }
            });
          }
        }


        function unbindMouseUpNLeave(){
          mouseUp = false;
          element.off('mouseleave');
          hasMouseLeave = null;
          element.off('mouseup');
          hasMouseUp    = null;
        }

        if(!isTouchDevice){
          element.on('mousedown', function(e) {
            if (e.stopPropagation) {
              e.stopPropagation();
            }
            if (e.preventDefault) {
              e.preventDefault();
            }
            if(!mouseUp){
              mouseHoldDownTimerStart();
            }
          });

        }else {
          element.on('touchend', function($event) {
            if ($event.stopPropagation) {
              $event.stopPropagation();
            }
            if ($event.preventDefault) {
              $event.preventDefault();
            }
            if(mouseState[scrollButtonType]&& !mouseUp  && !getButtonDisableState(scrollButtonType)){
              animateScrollRequest(true, false);
            }
          });

          element.on('touchstart', function($event) {
            if ($event.stopPropagation) {
              $event.stopPropagation();
            }
            if ($event.preventDefault) {
              $event.preventDefault();
            }
            if(!mouseState[scrollButtonType] && !getButtonDisableState(scrollButtonType)){
              animateScrollRequest(true, true);
            }
          });
        }
         //initialize click bid on..
        doClickBind();

        //attributes set in html set in scope
        scope.disableUp    = attr.disableUp    ? scope.$eval(attr.disableUp) : false;
        scope.disableDown  = attr.disableDown  ? scope.$eval(attr.disableDown) : false;
        scope.disableLeft  = attr.disableLeft  ? scope.$eval(attr.disableLeft) : false;
        scope.disableRight = attr.disableRight ? scope.$eval(attr.disableRight) : false;

        if( scope.disableUp ){
          wsScrollControlsCtrl.setControlsDeActiveState(scope.disableUp, 'up');
          updateButtonState(scope.disableUp, 'up');
        }else if(scope.disableDown){
          wsScrollControlsCtrl.setControlsDeActiveState( scope.disableDown, 'down');
          updateButtonState(scope.disableDown, 'down');
        }else if(scope.disableLeft){
          wsScrollControlsCtrl.setControlsDeActiveState(scope.disableLeft, 'left');
          updateButtonState(scope.disableLeft, 'left');
        }else if(scope.disableRight){
          wsScrollControlsCtrl.setControlsDeActiveState(scope.disableRight, 'right');
          updateButtonState(scope.disableRight, 'right');
        }
        scope.$on('$destroy', function(){
            touchControlsListener();
            scrollButtonUpdateListener();
            $timeout.cancel( udpateButtonStateTimer);
            $timeout.cancel( downEventTimer);
            $timeout.cancel( clickEventTimer);
            element.off('click');
            element.off('mousedown');
            element.off('mouseleave');
            element.off('mouseup');
            element.off('touchend');
            element.off('touchstart');
          });
      }
  };
});
