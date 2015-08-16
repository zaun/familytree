(function () {
  'use strict';

  app.controller('personListCtrl', function ($scope, $http, $state, $log, moment) {
    var getPersonList = function () {
      var url = '/api/people/';
      $log.info('Getting ' + url);
      $http({
        method: 'GET',
        url: url
      }).success(function (data) {
        // $log.info(JSON.stringify(data, null, 2));
        $scope.people = data;
        $scope.names = _.chain(data).pluck('last').countBy(_.identity).map(function (v, k) {
          return {
            name: k,
            count: v
          };
        }).sortBy('name').value();
      }).error(function () {
      });
    };
    getPersonList();

    $scope.gotoPerson = function (person) {
      $state.go('main.person', {personId: person.gedId});
    };

    $scope.getMaxChildren = function () {
      if (!$scope.people) {
        return '';
      }
      return _.max($scope.people, 'childrenCount').childrenCount;
    };

    $scope.getGenderClass = function (gender) {
      gender = (gender || '').toUpperCase();
      if (gender === 'MALE') {
        return 'fa fa-mars';
      }
      else if (gender === 'FEMALE') {
        return 'fa fa-venus';
      }
    };

    $scope.getBirthYear = function () {
      if ($scope.person && $scope.person.born && parseInt(moment($scope.person.born).format('YYYY')) > 999) {
        return moment($scope.person.born).format('YYYY');
      } else {
        return '';
      }
    };

    $scope.getDeathYear = function () {
      if ($scope.person && $scope.person.died && parseInt(moment($scope.person.died).format('YYYY')) > 999) {
        return moment($scope.person.died).format('YYYY');
      } else {
        return '';
      }
    };

    $scope.getDate = function (d) {
      var md = moment(d);
      if (d && md.isValid() && parseInt(md.format('YYYY')) > 999) {
        if (d.date && d.date.length === 4) {
          return 'Sometime in ' + md.format('YYYY');
        } else {
          return md.format('MMMM Do, YYYY');
        }
      } else {
        return '';
      }
    };
  });
})();