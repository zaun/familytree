(function () {
  'use strict';

  app.factory('BearerAuthInterceptor', function ($window, $q, $injector, $log, localStorageService) {
    return {
      request: function (config) {
        config.headers = config.headers || {};
        if (localStorageService.get('authToken')) {
          config.headers.Authorization = 'Bearer ' + localStorageService.get('authToken');
        }
        return config || $q.when(config);
      },
      response: function (response) {
        if (response.status === 401) {
          localStorageService.remove('authToken');
          localStorageService.remove('isAdmin');
          $injector.get('$state').go('login');
        }
        return response || $q.when(response);
      },
      responseError: function (response) {
        if (response.status === 401) {
          localStorageService.remove('authToken');
          localStorageService.remove('isAdmin');
          $injector.get('$state').go('login');
        }
        return response || $q.when(response);
      }
    };
  });
})();