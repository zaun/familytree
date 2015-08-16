(function () {
  'use strict';

  app.config(function ($stateProvider, $urlRouterProvider, $httpProvider, localStorageServiceProvider) {
    _.mixin(_.str.exports());

    $stateProvider
      .state('new', {
        url: '/new',
        templateUrl: 'html/views/new.html',
        controller: 'newCtrl'
      })
      .state('login', {
        url: '/login',
        templateUrl: 'html/views/login.html',
        controller: 'loginCtrl'
      })
      .state('logout', {
        url: '/logout',
        templateUrl: 'html/views/logout.html',
        controller: 'logoutCtrl'
      })
      .state('main', {
        templateUrl: 'html/views/main.html',
        controller: 'mainCtrl'
      })
      .state('main.admin', {
        url: '/admin',
        templateUrl: 'html/views/admin.html',
        controller: 'adminCtrl'
      })
      .state('main.person', {
        url: '/person/:personId',
        templateUrl: 'html/views/person.html',
        controller: 'personCtrl'
      })
      .state('main.personList', {
        url: '/people',
        templateUrl: 'html/views/personList.html',
        controller: 'personListCtrl'
      })
      .state('main.familyList', {
        url: '/families',
        templateUrl: 'html/views/familyList.html',
        controller: 'familyListCtrl'
      })
      .state('main.source', {
        url: '/source/:sourceId',
        templateUrl: 'html/views/source.html',
        controller: 'sourceCtrl'
      })
      .state('main.sourceList', {
        url: '/sources',
        templateUrl: 'html/views/sourceList.html',
        controller: 'sourceListCtrl'
      });
    $urlRouterProvider.otherwise('/login');

    $httpProvider.interceptors.push('BearerAuthInterceptor');
    localStorageServiceProvider.setPrefix('FamilyTree');
  });

  app.value('moment', window.moment);
  app.value('d3', window.d3);
})();