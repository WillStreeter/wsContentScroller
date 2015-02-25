angular.module('ws.scrollHelpers', ['common.services.ws.requestanimation'])
  .run(function($window, $q, cancelAnimation, wsRequestAnimation, wsScrollEasing) {
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

  });
