angular.module('common.directives.ws.scrollContainer', ['common.services.ws.scrollContainerAPI'])
  .directive('wsScrollContainer', function(wsSrollContainerAPI){
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
  });
