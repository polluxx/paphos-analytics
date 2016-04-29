export default
/*@ngInject*/
function($scope, items, project) {
  project.token = {profile_id: project.analytics.profileId};
  project.id = project._id;

  console.log(items.map(item => { return 'ga:pagePath==/' + item.url+".html"}));
  $scope.current = {
    project: project,
    date: {
      startDate: moment().subtract(6, 'day'),
      endDate: moment()
    },
    query: {
      ids: 'ga:' + project.analytics.profileId,
      metrics: 'ga:pageviews',
      dimensions: 'ga:pagePath, ga:date',
      filters: items.map(item => { return 'ga:pagePath==/' + item.url+".html"}).join(','),
      type: "plot",
      pure: true,
      chart: {
        fill: false,
        pointRadius: 1,
        pointHoverRadius: 3,
        lineTension: 0.1,
        'width': '100%'
      }
    }
  };
}