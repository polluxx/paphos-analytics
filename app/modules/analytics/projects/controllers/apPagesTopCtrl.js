export default
/*@ngInject*/
function($scope, items, project, dateService) {

  if(!project.analytics) console.error('No analytics provided! Have you add credentials?');
  
  project.token = {profile_id: project.analytics !== undefined ? project.analytics.profileId : null};
  project.id = project._id;
  console.log(items);

  $scope.$on('daterange', function(event, dateStart, dateEnd) {
    $scope.startDate = dateStart;
    $scope.endDate = dateEnd;
    $scope.$apply();
  });

  if(!items.length) return;
  
  $scope.current = {
    project: project,
    date: {
      startDate: $scope.startDate || dateService.start,
      endDate: $scope.endDate || dateService.end
    },
    query: {
      ids: 'ga:' + (project.analytics !== undefined ? project.analytics.profileId : null),
      metrics: 'ga:pageviews',
      dimensions: 'ga:pagePath, ga:date',
      filters: items.map(item => { return 'ga:pagePath==/' + item.url+".html"}).join(','),
      sort: '-ga:pageviews, -ga:date',
      type: "plot",
      pure: true,
      legend:false,
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