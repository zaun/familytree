(function () {
  'use strict';

  app.controller('mainCtrl', function ($scope, localStorageService) {
    $scope.isAdmin = !!localStorageService.get('isAdmin');
  });
})();