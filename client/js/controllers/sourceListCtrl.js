(function () {
  'use strict';

  app.controller('sourceListCtrl', function ($http, $log, $scope, $state) {
    var getSourceList = function () {
      var url = '/api/sources/';
      $log.info('Getting ' + url);
      $http({
        method: 'GET',
        url: url
      }).success(function (data) {
        // $log.info(JSON.stringify(data, null, 2));
        $scope.sources = data;
      }).error(function () {
      });
    };
    getSourceList();

    $scope.gotoSource = function (source) {
      $state.go('main.source', {sourceId: source.gedId});
    };
  });
})();