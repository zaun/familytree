(function () {
  'use strict';

  app.controller('newCtrl', function ($scope, $state, $http, $log, Upload) {
    $scope.uploadFile = function () {
      if ($scope.passwordA !== $scope.passwordB) {
        $log.warn('Passwords do not match');
        return;
      }

      if ($scope.gedcomFile) {
        Upload.upload({
          url: '/upload',
          file: $scope.gedcomFile
        }).success(function () {
          $scope.uploading = false;
          $scope.processing = false;

          $http({
            method: 'POST',
            url: '/api/users/',
            data: {
              name: $scope.name,
              username: $scope.username,
              password: $scope.passwordA
            }
          }).success(function (data) {
            $log.info(data);
            $state.go('main.personList');
          }).error(function () {
            $log.warn('Could not create user');
            return;
          });

        }).progress(function (evt) {
          $scope.progressPercentage = parseInt(100.0 * evt.loaded / evt.total);
          $scope.processing = true;
        }).error(function (data, status) {
          $scope.uploading = false;
          $scope.processing = false;
          $log.info('error status: ' + status);
        });
      }
    };

    // check to make sure the site is active
    $scope.active = true;
    $http({
      method: 'GET',
      url: '/api/active/'
    }).success(function (data) {
      $scope.active = data.active ? data.active : false;
      if ($scope.active) {
        $state.go('login');
      }
    }).error(function () {
    });
  });
})();