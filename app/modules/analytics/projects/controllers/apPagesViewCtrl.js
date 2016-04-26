export default
/*@ngInject*/
function($scope, item, project, ngAnalyticsService, aSiteModel, $http, NgTableParams) {
  /* tmp */
  item = item.data[0];

  item.url = [item.category.parentAlias, item.category.alias, item.alias].join("/");
  /* tmp */

  project.token = {profile_id: project.analytics.profileId};
  project.id = project._id;

  $scope.item = item;
  $scope.project = project;


  angular.extend($scope, {
      item: $scope.item,
      current: {
        site: $scope.item.url,
        date: {
          startDate: moment().subtract(6, 'day'),
          endDate: moment()
        }
      },
      query: {
        ids: 'ga:' + $scope.project.analytics.profileId,
        metrics: 'ga:pageviews',
        dimensions: 'ga:source, ga:date',
        filters: 'ga:pagePath=@' + $scope.item.url
      }
    }
  );
}
