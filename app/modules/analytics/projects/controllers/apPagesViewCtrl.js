export default
/*@ngInject*/
function($scope, item, project, aKeywordModel, NgTableParams) {
  project.token = {profile_id: project.analytics.profileId};
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
    ids: 'ga:' + $scope.project.analytics.profileId,
    metrics: 'ga:pageviews',
    dimensions: 'ga:source, ga:date',
    filters: 'ga:pagePath=@' + $scope.item.url,
    type: "plot"
  };

  $scope.keywordsTableParams = new NgTableParams({
    page: 1,
    count: 100,
    sorting: {

    }
  }, {
    getData: function(params) {
      var res = aKeywordModel.query({page: params.page(), perPage: 100}, function(resp) { return resp; });
      console.log(res);
      return res;
    }
  });

  console.log($scope.keywordsTableParams);

}
