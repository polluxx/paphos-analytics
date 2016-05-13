export default
/*@ngInject*/
($stateProvider, $urlRouterProvider) => {

  $urlRouterProvider.otherwise(function($inject) {
       var $state = $inject.get('$state');
       $state.go('analytics.dashboard');
  });

  $stateProvider
    .state('private', { // complete
      abstract: true,
      views: {
        'dashboard': {templateUrl: 'app/views/master-dashboard.html'}
      }
    })
  ;
};