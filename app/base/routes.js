export default
/*@ngInject*/
function($stateProvider, $urlRouterProvider) {

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
        .state('private', {
            url:"/"
        })
    ;

    $stateProvider.state("home", {
      url: "/"
    });
};