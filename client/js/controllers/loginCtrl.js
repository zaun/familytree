(function () {
  'use strict';

  app.controller('loginCtrl', ['$scope', '$http', '$log', '$state', 'localStorageService', function ($scope, $http, $log, $state, localStorageService) {
    $scope.doLogin = function () {
      $http({
        method: 'POST',
        url: '/api/auth/',
        data: {
          username: $scope.username,
          password: $scope.password
        }
      }).success(function (data) {
        if (data && data.success && data.success === true && data.token) {
          localStorageService.set('authToken', data.token);
          localStorageService.set('isAdmin', data.isAdmin);
          $state.go('main.personList');
          return;
        }
      }).error(function () {
      });
    };


    // check to make sure the site is active
    $scope.active = false;
    $http({
      method: 'GET',
      url: '/api/active/'
    }).success(function (data) {
      $scope.active = data.active ? data.active : false;

      // This tree isn't active send them to create it
      if (!$scope.active) {
        $state.go('new');
        return;
      }

      // Do we already have an auth token
      if (localStorageService.get('authToken')) {
        $state.go('main.personList');
      }
    }).error(function () {
    });

  }]);
})();