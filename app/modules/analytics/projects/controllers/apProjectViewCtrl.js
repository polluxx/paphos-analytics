export default
/*@ngInject*/
function ($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams, dateService) {
  var profilesId = !item.analytics ? null : item.analytics.profileId;

  item.token = {profile_id: profilesId};
  item.id = item._id;
  $scope.item = item;

  //$scope.query = null;

  // $templateCache.remove('/app/views/analytics/directives/analytics-report.html');
  // console.log('$templateCache', $templateCache.get('/app/views/analytics/directives/analytics-report.html'));

  $scope.query = {
    ids: 'ga:' + profilesId,  // put your viewID here
    metrics: 'ga:users',
    dimensions: 'ga:source, ga:date',
    legend:false,
    type: "plot"
  };

  $scope.current = {
    site: item.siteUrl,
    date: {
      startDate: dateService.start,
      endDate: dateService.end
    }
  };

  $scope.dateService = dateService;


  if (!item.analytics) {
    $scope.query.$error= {code: 404, message:"Нет токена авторизации. Авторизируйтесь в сервисе GA."};
    return;
  }

  $scope.$watch(() => ngAnalyticsService.isReady, isReady => {
    if (isReady) {
      if (!item.tokens) return console.error('No tokens provided!');

      if(ngAnalyticsService.ga.auth.isAuthorized()) return;

      ngAnalyticsService.setToken(item.tokens.access_token);
      ngAnalyticsService.authorize();
    }
  });

  aSiteModel.yandex($scope, dateService, $scope.item);

}