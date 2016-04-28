export default
/*@ngInject*/
($stateProvider, $urlRouterProvider) => {

    // $urlRouterProvider.otherwise(function($inject) {
    //     var $state = $inject.get('$state');
    //     $state.go('homepage');
    // });

    $stateProvider 
    //Main page
        .state('homepage', {
            url:"/",
            views: {
                'main-content':{
                    controller: "MainServiceCtrl",
                    templateUrl: "app/views/home.html"
                }
            }
        })
      .state('private', { // complete
        abstract: true,
        views: {
          'dashboard': {templateUrl: 'app/views/master-dashboard.html'}
        }
      })
    ;

    $stateProvider.state("home", {
      url: "/"
    });
};