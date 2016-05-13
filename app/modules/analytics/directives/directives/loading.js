export default
/*@ngInject*/
function() {
  return {
    restrict: 'E',
    scope: {
      loading: '=ngModel'
    },
    templateUrl: '/app/views/analytics/directives/loading.html'
  };
}

