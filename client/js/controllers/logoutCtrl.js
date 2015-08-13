(function () {
  'use strict';

  app.controller('logoutCtrl', ['$scope', 'localStorageService', function ($scope, localStorageService) {
    localStorageService.remove('authToken');
  }]);
})();