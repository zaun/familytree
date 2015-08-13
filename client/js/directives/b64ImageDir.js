(function () {
  'use strict';

  // http://bl.ocks.org/mbostock/2966094
  // http://www.sitepoint.com/creating-charting-directives-using-angularjs-d3-js/
  app.directive('b64Image', [function () {
    return {
      restrict: 'E',
      templateUrl: 'html/directives/b64Image.html',
      scope: {
        src: '='
      },

      controller: function ($scope, $http, $log) {
        $scope.$watch('src', function (value) {
          if (value) {
            $scope.b64 = '';
            $log.info('Getting ' + value);
            $http.get(value).then(function (response) {
              $scope.b64 = response.data;
            });
          }
        });
      }
    };
  }]);

})();