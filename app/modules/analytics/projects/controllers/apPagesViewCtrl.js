export default
/*@ngInject*/
function($scope, item, project, ngAnalyticsService, aSiteModel, $http, NgTableParams) {
  /* tmp */
  console.log(project);
  item = item.data[0];

  item.url = [item.category.parentAlias, item.category.alias, item.alias].join("/");
  console.log(item);
  /* tmp */


  $scope.item = item;
  $scope.project = project;

}