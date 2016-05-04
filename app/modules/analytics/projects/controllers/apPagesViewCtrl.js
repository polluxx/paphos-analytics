export default
/*@ngInject*/
function($scope, item, project, aPageModel, NgTableParams) {

  if(!project.analytics) console.error('No analytics provided! Have you add credentials?');

  project.token = {profile_id: project.analytics !== undefined ? project.analytics.profileId : null};
  project.id = project._id;

  $scope.item = item;
  $scope.project = project;

  console.log(project);
  console.log(item);


  $scope.current = {
    site: $scope.item.url,
    date: {
      startDate: moment().subtract(6, 'day'),
      endDate: moment()
    }
  };

  $scope.query = {
    ids: 'ga:' + ($scope.project.analytics !== undefined ? $scope.project.analytics.profileId : null),
    metrics: 'ga:pageviews',
    dimensions: 'ga:source, ga:date',
    filters: 'ga:pagePath=@' + $scope.item.url,
    type: "plot"
  };

  $scope.keywordsTableParams = new NgTableParams({
    page: 1,
    count: 100,
    sorting: {
      frequency: 'desc'
    }
  }, {
    getData: function(params) {
      var res = aPageModel.keywords({_id:$scope.item._id}, function(resp) { return resp; });
      console.log(res);
      return res;
    }
  });

  console.log($scope.keywordsTableParams);

}
