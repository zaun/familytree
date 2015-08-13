(function () {
  'use strict';

  app.controller('adminCtrl', function ($scope, $http, $log, $state, Upload, moment) {
    $scope.uploadFile = function () {
      if ($scope.gedcomFile) {
        $scope.uploading = true;
        $scope.processing = false;
        // fileUpload.uploadFileToUrl($scope.gedcomFile, '/upload/').then(function () {
        //   $scope.uploading = false;
        // });

        Upload.upload({
          url: '/upload',
          file: $scope.gedcomFile
        }).success(function () {
          $scope.uploading = false;
          $scope.processing = false;
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

    var getUserList = function () {
      var url = '/api/users/';
      $log.info('Getting ' + url);
      $http({
        method: 'GET',
        url: url
      }).success(function (data) {
        // $log.info(JSON.stringify(data, null, 2));
        $scope.users = data;
      }).error(function () {
      });
    };
    getUserList();

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

    $scope.newUser = {};
    $scope.addUser = function () {
      $http({
        method: 'POST',
        url: '/api/users/',
        data: {
          name: $scope.newUser.name,
          username: $scope.newUser.username,
          admin: $scope.newUser.admin,
          password: $scope.newUser.passwordA
        }
      }).success(function () {
        $scope.users.push(_.clone($scope.newUser));
        $scope.newUser = {};
      }).error(function () {
        $scope.newUser = {};
        $log.warn('Could not create user');
        return;
      });
    };


  });
})();