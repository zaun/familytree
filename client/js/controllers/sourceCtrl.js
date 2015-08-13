(function () {
  'use strict';

  app.controller('sourceCtrl', function ($http, $log, $scope, $state, $stateParams, moment, util) {
    var getSource = function () {
      var url = '/api/sources/' + $stateParams.sourceId;
      $log.info('Getting ' + url);
      $http({
        method: 'GET',
        url: url
      }).success(function (data) {
        $log.info(JSON.stringify(data, null, 2));
        $scope.source = data;
      }).error(function () {
      });
    };
    getSource();

    $scope.gotoPerson = function (person) {
      $state.go('main.person', {personId: person.gedId});
    };

    $scope.personOrderBy = function (p) {
      return moment(p.birth ? p.birth.date : '1201-01-01').toISOString() + p.last + p.first;
    };

    $scope.eventOrderBy = function (e) {
      return e.event.type + moment(e.event.date ? e.event.date : '1201-01-01').toISOString();
    };

    $scope.getThumbUrl = function (file) {
      return '/api/thumb/'  + file;
    };

    $scope.getImageUrl = function (file) {
      return '/api/image/'  + file;
    };

    $scope.displayImage = function (item) {
      $scope.fullscreen = item;
    };

    $scope.close = function () {
      $scope.fullscreen = null;
    };

    $scope.getTypeClass = util.getEventIconClass;
    $scope.getTypeName = util.getEventName;
    $scope.getGenderClass = util.getGenderIconClass;
    $scope.getDate = util.getFormattedDate;
    $scope.isLink = util.isLink;

  });
})();