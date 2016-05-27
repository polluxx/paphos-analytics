export default
/*@ngInject*/
function ($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams, dateService) {
  var profilesId = !item.analytics ? null : item.analytics.profileId;

  item.token = {profile_id: profilesId};
  item.id = item._id;
  $scope.item = item;
  $scope.query = {
    ids: 'ga:' + profilesId,  // put your viewID here
    metrics: 'ga:organicSearches',
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


  if (!item.analytics) {
    $scope.query.$error= {code: 404, message:"Нет токена авторизации. Авторизируйтесь в сервисе GA."};
    return;
  }

  $scope.$watch(() => ngAnalyticsService.isReady, isReady => {
    if (isReady) {
      if (!item.tokens) return console.error('No tokens provided!');

      ngAnalyticsService.setToken(item.tokens.access_token);
      ngAnalyticsService.authorize();

      $scope.getYandexUpdates();
    }
  });

  $scope.getYandexUpdates = () => {
    aSiteModel.yandexUpdates({dateFrom: dateService.start, dateTo: dateService.end}, resp => {
      $scope.item.yandexUpdates = resp;
    });
  };
}