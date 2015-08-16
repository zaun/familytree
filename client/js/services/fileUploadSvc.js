(function () {
  'use strict';

  app.service('fileUpload', function ($http, $log, $q) {
    this.uploadFileToUrl = function (file, uploadUrl) {
      var deferred = $q.defer();

      var fd = new FormData();
      fd.append('file', file);
      $http.post(uploadUrl, fd, {
        transformRequest: angular.identity,
        headers: {'Content-Type': undefined}
      })
      .success(function () {
        deferred.resolve();
      })
      .error(function (msg, code) {
        deferred.reject(msg);
        $log.error(msg, code);
      });

      return deferred.promise;
    };
  });

})();