export default
/*@ngInject*/
function ($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams, dateService, $templateCache) {
  var profilesId = !item.analytics ? null : item.analytics.profileId;

  item.token = {profile_id: profilesId};
  item.id = item._id;
  $scope.item = item;

  $templateCache.remove('/app/views/analytics/directives/analytics-report.html');
  console.log('$templateCache', $templateCache.get('/app/views/analytics/directives/analytics-report.html'));

  $scope.query = {
    ids: 'ga:' + profilesId,  // put your viewID here
    metrics: 'ga:users',
    dimensions: 'ga:source, ga:date',
    legend:false,
    type: "plot",
    colors: [
      'rgba(151,187,205,1)',
      'rgba(247,70,74,1)',
      'rgba(70,191,189,1)',
      'rgba(253,180,92,1)',
      // for keywords
      'rgba(77,83,96,1)',
      'rgba(148,159,177,1)'
    ]
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

      ngAnalyticsService.setToken(item.tokens.access_token);
      ngAnalyticsService.authorize();
    }
  });

  $scope.$watch(() => dateService, () => {
    $scope.getYandexUpdates();
  }, true);

  $scope.getYandexUpdates = () => {
    aSiteModel.yandexUpdates({dateFrom: dateService.start, dateTo: dateService.end}, resp => {
      $scope.item.yandexUpdates = resp;
    });
  };
}