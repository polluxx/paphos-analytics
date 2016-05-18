export default
/*@ngInject*/
function ($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams, dateService) {
  console.log(item);
  var profilesId = !item.analytics ? null : item.analytics.profileId;

  item.token = {profile_id: profilesId};
  item.id = item._id;
  $scope.item = item;
  $scope.query = {
    ids: 'ga:' + profilesId,  // put your viewID here
    metrics: 'ga:pageviews',
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
    aSiteModel.yandexUpdates(function (resp) {
      if (!resp || resp.status != 200) {
        console.error("Error on response");
        return;
      }

      $scope.item.yandexUpdates = JSON.parse(resp.body);
    });
  };
}