
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


angular.module('ws.scrollHelpers', ['common.services.ws.requestanimation'])
  .run(["$window", "$q", "cancelAnimation", "wsRequestAnimation", "wsScrollEasing", function($window, $q, cancelAnimation, wsRequestAnimation, wsScrollEasing) {
    'use strict';

    var proto = {};

    var isDocument = function(el) {
      return (typeof window.HTMLDocument !== 'undefined' && el instanceof window.HTMLDocument) || (el.nodeType && el.nodeType === el.DOCUMENT_NODE);
    };

    var isElement = function(el) {
      return (typeof window.HTMLDocument !== 'undefined' && el instanceof window.HTMLDocument) || (el.nodeType && el.nodeType === el.ELEMENT_NODE);
    };

    var unwrap = function(el) {
      return isElement(el) || isDocument(el) ? el : el[0];
    };

    proto.wsScrollTo = function(left, top, duration, easing) {
      if(duration && !easing) {
        easing = wsScrollEasing;
      }
      var aliasFn;
      if(angular.isDefined(duration)) {
        aliasFn = this.wsScrollToAnimated;
      }
      if(aliasFn) {
        return aliasFn.apply(this, arguments);
      }
      var el = unwrap(this);
      if(isDocument(el)) {
        return $window.scrollTo(left, top);
      }
      el.scrollLeft = left;
      el.scrollTop = top;
    };

    var scrollAnimation, deferred;
    proto.wsScrollToAnimated = function(left, top, duration, easing) {

      if(duration && !easing) {
        easing = wsScrollEasing;
      }
      var startLeft = this.wsScrollLeft(),
        startTop    = this.wsScrollTop(),
        deltaLeft   = Math.round(left - startLeft),
        deltaTop    = Math.round(top - startTop);

      var startTime = null;
      var el        = this;

      var cancelOnEvents = 'scroll mouseup  touchmove keyup';
      var cancelScrollAnimation = function($event) {
        if (!$event || $event.which > 0) {
          el.unbind(cancelOnEvents, cancelScrollAnimation);
          cancelAnimation(scrollAnimation);
          deferred.reject();
          scrollAnimation = null;
        }
      };
      if(duration <= 0){
        duration = 0;
        cancelScrollAnimation();
        deferred = $q.defer();
        deferred.resolve();
        return deferred.promise;
      }

      if(scrollAnimation) {
        cancelScrollAnimation();
      }

      deferred = $q.defer();

      if(duration === 0 || (!deltaLeft && !deltaTop)) {
        if(duration === 0) {
          el.wsScrollTo(left, top);
        }
        deferred.resolve();
        return deferred.promise;
      }

      var animationStep = function(timestamp) {
        if (startTime === null) {
          startTime = timestamp;
        }

        var progress = timestamp - startTime;
        var percent = (progress >= duration ? 1 : easing(progress/duration));

        el.scrollTo(
          startLeft + Math.ceil(deltaLeft * percent),
          startTop + Math.ceil(deltaTop * percent)
        );
        if(percent < 1) {
          scrollAnimation = wsRequestAnimation(animationStep);
        } else {
          el.unbind(cancelOnEvents, cancelScrollAnimation);
          scrollAnimation = null;
          deferred.resolve();
        }
      };

      //Fix random mobile safari bug when scrolling to top by hitting status bar
      el.wsScrollTo(startLeft, startTop);

      el.bind(cancelOnEvents, cancelScrollAnimation);

      scrollAnimation = wsRequestAnimation(animationStep);
      return deferred.promise;
    };

    proto.wsScrollLeft = function(value, duration, easing) {
      if(angular.isNumber(value)) {
        return this.wsScrollTo(value, this.wsScrollTop(), duration, easing);
      }
      var el = unwrap(this);
      if(isDocument(el)) {
        return $window.scrollX || document.documentElement.scrollLeft || document.body.scrollLeft;
      }
      return el.scrollLeft;
    };

    proto.wsScrollTop = function(value, duration, easing) {
      if(angular.isNumber(value)) {
        return this.wsScrollTo(this.wsScrollLeft(), value, duration, easing);
      }
      var el = unwrap(this);
      if(isDocument(el)) {
        return $window.scrollY || document.documentElement.scrollTop || document.body.scrollTop;
      }
      return el.scrollTop;
    };

    //scroll vertical, set amount....
    proto.wsScrollYIncrement = function(scrollDirection, scrollIncrementPercentage){
      var el = unwrap(this);
      var containerHeight       =  Math.round(angular.element(el)[0].clientHeight);
      var scrollHeight          =  Math.round(angular.element(el)[0].scrollHeight);
      var scrollTop             =  angular.element(el)[0].scrollTop;
      var scrollYIncrement      = 0;
      var scrollYStop           = false;
      if (scrollDirection === 'down') {
        var currentScrollIncrease = (scrollTop + (containerHeight * scrollIncrementPercentage));
        if((currentScrollIncrease + containerHeight) >= scrollHeight ){
          scrollYStop      = true;
          scrollYIncrement = scrollHeight;
        }else{
          scrollYIncrement =  Math.round(currentScrollIncrease);
        }
      } else  if (scrollDirection === 'up'){
        var nextScrollIncrease = (scrollTop - (containerHeight * (scrollIncrementPercentage *2)));
        if(nextScrollIncrease <= 0){
          scrollYStop      = true;
          scrollYIncrement = 0;
        }else {
          scrollYIncrement = Math.round(scrollTop - (containerHeight * scrollIncrementPercentage));
        }
      }
      return {incrementValue:scrollYIncrement, deactivate:scrollYStop};
    };

    //scroll vertical, continous... entil end or mouse up....
    proto.wsScrollYIncrementFull = function(scrollDirection) {
      var el               = unwrap(this);
      var containerHeight  = Math.round(angular.element(el)[0].clientHeight);
      var scrollHeight     = Math.round(angular.element(el)[0].scrollHeight);
      var scrollTop        = angular.element(el)[0].scrollTop;
      var scrollYIncrement = 0;
      var scrollDuration   = 0;
      if (scrollDirection === 'down') {
          var downDurationIncrement = Math.round((scrollHeight - scrollTop)/containerHeight);
          scrollDuration           =   downDurationIncrement > 1? downDurationIncrement *500 : 500;
          scrollYIncrement         = scrollHeight;
      } else  if (scrollDirection === 'up'){
          var uplDurationIncrement    =  Math.round(scrollHeight / containerHeight);
          scrollDuration              =  uplDurationIncrement> 1? uplDurationIncrement * 500 : 500;
          scrollYIncrement            = 0;
      }
      return {incrementValue:scrollYIncrement, duration:scrollDuration};
    };

    //scroll vertical, continous... until end or mouse up....
    proto.wsScrollXIncrement = function(scrollDirection, scrollIncrementPercentage){
      var el = unwrap(this);
      //horizontal
      var containerWidth                  = Math.round(angular.element(el)[0].clientWidth);
      var scrollWidth                     = Math.round(angular.element(el)[0].scrollWidth);
      var scrollLeft                      = Math.round(angular.element(el)[0].scrollLeft);
      var scrollXIncrement                = 0;
      var scrollXStop                     = false;
      if(scrollDirection === 'right') {
       var currentScrollIncrease = (scrollLeft + (containerWidth * scrollIncrementPercentage));
       if((currentScrollIncrease + containerWidth) >= scrollWidth){
          scrollXIncrement  = scrollWidth;
          scrollXStop   = true;
        }else{
          scrollXIncrement  =  Math.round(currentScrollIncrease);
       }
      } else  if (scrollDirection === 'left'){
        var nextScrollIncrease = (scrollLeft - (containerWidth * (scrollIncrementPercentage *2)));
        if(nextScrollIncrease <= 0){
          scrollXIncrement = 0;
          scrollXStop   = true;
        }else {
          scrollXIncrement =  Math.round((scrollLeft - (containerWidth *scrollIncrementPercentage)));
        }
      }
      return {incrementValue:scrollXIncrement, deactivate:scrollXStop};
    };

    //scroll horizontal, continous... entil end or mouse up....
    proto.wsScrollXIncrementFull = function(scrollDirection){
      var el                              = unwrap(this);
      //horizontal
      var scrollWidth                     = Math.round(angular.element(el)[0].scrollWidth);
      var containerWidth                  = Math.round(angular.element(el)[0].clientWidth);
      var scrollLeft                      = Math.round(angular.element(el)[0].scrollLeft);
      var scrollXIncrement                = 0;
      var scrollDuration                  = 0;
      if(scrollDirection === 'right') {
          scrollXIncrement  = scrollWidth;
          var rightDurationIncrement = Math.round((scrollWidth - scrollLeft)/containerWidth);
          scrollDuration    =  rightDurationIncrement > 1? rightDurationIncrement *500 : 500;
      } else  if (scrollDirection === 'left') {
          scrollXIncrement = 0;
          var leftDurationIncrement = Math.round(scrollLeft/containerWidth);
          scrollDuration    =  leftDurationIncrement > 1? leftDurationIncrement *500 : 500;
      }
      return {incrementValue:scrollXIncrement, duration:scrollDuration};
    };

    angular.forEach(proto, function(fn, key) {
      angular.element.prototype[key] = fn;

      //Remove prefix if not already claimed by jQuery / ui.utils
      var unprefixed = key.replace(/^wsScroll/, 'scroll');
      if(angular.isUndefined(angular.element.prototype[unprefixed])) {
        angular.element.prototype[unprefixed] = fn;
      }
    });

  }]);


angular.module('common.directives.ws.scrollContainer', ['common.services.ws.scrollContainerAPI'])
  .directive('wsScrollContainer', ["wsSrollContainerAPI", function(wsSrollContainerAPI){
    'use strict';

    return {
      restrict: 'A',
      scope: true,
      compile: function compile() {
        return {
          pre: function preLink($scope, iElement, iAttrs) {
            iAttrs.$observe('wsScrollContainer', function(element) {
              if(angular.isString(element)) {
                element = document.getElementById(element);
              }

              element = (angular.isElement(element) ? angular.element(element) : iElement);
              wsSrollContainerAPI.setContainer($scope, element);
              $scope.$on('$destroy', function() {
                wsSrollContainerAPI.removeContainer($scope);
              });
            });
          }
        };
      }
    };
  }]);


angular.module('common.directives.ws.scrollControls', ['ws.scrollHelpers', 'common.services.ws.debounce', 'common.services.ws.scrollContainerAPI']);
/* Service Decorators can be configured in `config` blocks */
angular.module('common.directives.ws.scrollControls').config(["$provide", function ($provide) {
  'use strict';
  //http://stackoverflow.com/questions/23147757/how-to-get-the-status-of-angular-interval-check-if-the-interval-has-been-canc

  /* Register a decorator for the `$interval` service */
  $provide.decorator('$interval', ["$delegate", function ($delegate) {

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
  }]);
}]);

angular.module('common.directives.ws.scrollControls').directive('wsScrollControls',
  ['wsScrollDuration', '$interval', 'wsDebounce', '$timeout','wsSrollContainerAPI',
  function(wsScrollDuration, $interval, wsDebounce, $timeout, wsSrollContainerAPI) {
  'use strict';

  return {
    restrict:'A',
    scope:{
      scrollTarget:'@'
    },
    controller: ["$log", "$scope", "$interval", function($log, $scope, $interval) {
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

    }],
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



angular.module('common.directives.ws.scrollControls').directive('scrollButton', ["$interval", "$timeout", function($interval, $timeout) {
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
}]);


angular.module('common.services.ws.requestanimation', ['common.services.ws.polyfill'])
  .factory('wsRequestAnimation', ["wsPolyfill", "$timeout", function(wsPolyfill, $timeout) {
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
  }])
  .factory('cancelAnimation', ["wsPolyfill", "$timeout", function(wsPolyfill, $timeout) {
    'use strict';

    var fallback = function(promise) {
      $timeout.cancel(promise);
    };

    return wsPolyfill('cancelAnimationFrame', fallback);
  }]);


angular.module('common.services.ws.scrollContainerAPI', [])
  .factory('wsSrollContainerAPI', ["$document", function($document) {
    'use strict';

    var containers = {};

    var setContainer = function(scope, element) {
      var id = scope.$id;
      containers[id] = element;
      return id;
    };

    var getContainerId = function(scope) {
      if(containers[scope.$id]) {
        return scope.$id;
      }
      if(scope.$parent) {
        return getContainerId(scope.$parent);
      }
      return;
    };

    var getContainer = function(scope) {
      var id = getContainerId(scope);
      return id ? containers[id] : $document;
    };

    var removeContainer = function(scope) {
      var id = getContainerId(scope);
      if(id) {
        delete containers[id];
      }
    };

    return {
      getContainerId:   getContainerId,
      getContainer:     getContainer,
      setContainer:     setContainer,
      removeContainer:  removeContainer
    };
  }]);


angular.module('common.services.ws.debounce', [])
.factory('wsDebounce', ["$timeout", function($timeout) {
    'use strict';
    return function(func, wait, immediate) {
    var timeout = null;
    return function() {
      var context = this,
        args = arguments,
        callNow = immediate && !timeout;
      if(timeout) {
        $timeout.cancel(timeout);
      }
      timeout = $timeout(function later() {
        timeout = null;
        if(!immediate) {
          func.apply(context, args);
        }
      }, wait, false);
      if(callNow) {
        func.apply(context, args);
      }
      return timeout;
    };
  };
}]);


//Adapted from https://gist.github.com/paulirish/1579671
angular.module('common.services.ws.polyfill', [])
  .factory('wsPolyfill', ["$window", function($window) {
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
  }]);

