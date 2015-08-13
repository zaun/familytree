(function () {
  'use strict';

  app.directive('loading', [function () {
    return {
      restrict: 'E',
      templateUrl: 'html/directives/loading.html'
    };
  }]);

})();