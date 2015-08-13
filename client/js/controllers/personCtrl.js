(function () {
  'use strict';

  app.controller('personCtrl', function ($scope, $http, $stateParams, $state, $log, moment, util) {
    var getPerson = function () {
      var url = '/api/people/' + $stateParams.personId;
      $log.info('Getting ' + url);
      $http({
        method: 'GET',
        url: url
      }).success(function (data) {
        // $log.info(JSON.stringify(data, null, 2));
        $scope.person = data;
      }).error(function () {
      });
    };
    getPerson();

    $scope.gotoPerson = function (person) {
      $state.go('main.person', {personId: person.gedId});
    };

    $scope.getPictureClass = function () {
      if ($scope.person && $scope.person.gender && $scope.person.gender.toLowerCase() === 'male') {
        return 'male';
      }
      else if ($scope.person && $scope.person.gender && $scope.person.gender.toLowerCase() === 'female') {
        return 'female';
      }
      else {
        return 'unknown';
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

    $scope.getAge = function () {
      var born, died, age;
      if ($scope.person && $scope.person.birth && $scope.person.death) {
        born = moment($scope.person.birth.date);
        died = moment($scope.person.death.date);
        if (born.isValid() && parseInt(born.format('YYYY')) > 999 && died.isValid() && parseInt(died.format('YYYY')) > 999) {
          age = moment.duration(died.diff(born)).asYears().toFixed(1);
          if (age > 0 && age < 100) {
            return age;
          } else {
            return '?';
          }
        } else {
          return '?';
        }
      } else if ($scope.person && $scope.person.born) {
        born = moment($scope.person.born);
        if (born.isValid() && parseInt(born.format('YYYY')) > 999) {
          age = moment.duration(moment().diff(born)).asYears().toFixed(1);
          if (age > 0 && age < 100) {
            return age;
          } else {
            return '?';
          }
        } else {
          return '?';
        }
      } else {
        return '?';
      }
    };

    $scope.getFirstChildAge = function () {
      if (!$scope.person || !$scope.person.born) {
        return '';
      }
      var born = moment($scope.person.born);
      if (!born.isValid()) {
        return '';
      }
      var children = _.sortBy($scope.person.children, 'born');
      var d = _.first(children);
      if (!d) {
        return '';
      }
      d = moment(d.born);
      var age = moment.duration(d.diff(born)).asYears().toFixed(1);
      if (age < 0) {
        return '';
      }
      return age;
    };

    $scope.getLastChildAge = function () {
      if (!$scope.person || !$scope.person.born) {
        return '';
      }
      var born = moment($scope.person.born);
      if (!born.isValid()) {
        return '';
      }
      var children = _.sortBy($scope.person.children, 'born');
      var d = _.last(children);
      if (!d) {
        return '';
      }
      d = moment(d.born);
      var age = moment.duration(d.diff(born)).asYears().toFixed(1);
      if (age < 0) {
        return '';
      }
      return age;
    };

    $scope.getTypeClass = util.getEventIconClass;
    $scope.getTypeName = util.getEventName;
    $scope.getGenderClass = util.getGenderIconClass;
    $scope.getDate = util.getFormattedDate;
    $scope.isLink = util.isLink;

    $scope.getEventAge = function (e) {
      if ($scope.person && $scope.person.born && $scope.person.died) {
        var born = moment($scope.person.born);
        var d = moment(e.date);
        if (born.isValid() && d.isValid()) {
          var days = moment.duration(d.diff(born)).asYears().toFixed(1);
          if (days >= 0) {
            return days;
          } else {
            return '';
          }
        } else {
          return '';
        }
      } else {
        return '';
      }
    };
  });
})();