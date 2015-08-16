(function () {
  'use strict';

  app.controller('familyListCtrl', function ($scope, $http, $state, $log, util) {
    var getFamilyList = function () {
      var url = '/api/families/';
      $log.info('Getting ' + url);
      $http({
        method: 'GET',
        url: url
      }).success(function (data) {
        // $log.info(JSON.stringify(data, null, 2));
        $scope.families = data;
      }).error(function () {
      });
    };
    getFamilyList();

    $scope.familySort = function (f) {
      if (f.partners.length === 1) {
        return f.partners[0].last + ' ' + f.partners[0].first;
      }
      else if (f.partners.length === 2) {
        return f.partners[0].last + ' ' + f.partners[0].first + f.partners[1].last + ' ' + f.partners[1].first;
      }
    };

    $scope.gotoPerson = function (person) {
      $state.go('main.person', {personId: person.gedId});
    };

    $scope.getMaxChildren = function () {
      if (!$scope.families) {
        return '';
      }
      return _.max($scope.families, 'childrenCount').childrenCount;
    };

    $scope.getTypeClass = util.getEventIconClass;
    $scope.getTypeName = util.getEventName;
    $scope.getGenderClass = util.getGenderIconClass;
    $scope.getDate = util.getFormattedDate;

  });
})();