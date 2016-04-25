export default
/*@ngInject*/
function($scope, item, project, ngAnalyticsService, aSiteModel, $http, NgTableParams) {
  console.log(item);
  console.log(project);
  $scope.item = item;
  $scope.project = project;

}