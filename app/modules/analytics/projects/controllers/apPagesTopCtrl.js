export default
/*@ngInject*/
function($scope, items, project, dateService, aSiteModel) {

  if(!project.analytics) console.error('No analytics provided! Have you add credentials?');

  project.token = {profile_id: project.analytics !== undefined ? project.analytics.profileId : null};
  project.id = project._id;
  console.log(items);

  $scope.startDate = dateService.start;
  $scope.endDate = dateService.end;

  $scope.dateService = dateService;

  if(!items.length) return;

  $scope.current = {
    project: project,
    date: {
      startDate: $scope.startDate || dateService.start,
      endDate: $scope.endDate || dateService.end
    },
    query: {
      ids: 'ga:' + (project.analytics !== undefined ? project.analytics.profileId : null),
      metrics: 'ga:users',
      dimensions: 'ga:pagePath, ga:date',
      filters: items.map(item => {
        if(item.url[0] == '/'){
          return 'ga:pagePath==' + item.url +".html"
        }
        return 'ga:pagePath==/' + item.url+".html"
      }).join(','),
      sort: '-ga:users, -ga:date',
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

  aSiteModel.yandex($scope, dateService, $scope.current.project);
}