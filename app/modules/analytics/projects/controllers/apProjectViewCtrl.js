export default
/*@ngInject*/
function ($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams) {
  console.log(item);
  if (!item.analytics) return;

  item.token = {profile_id: item.analytics.profileId};
  item.id = item._id;

  $scope.item = item;

  $scope.current = {
    site: item.siteUrl,
    date: {
      startDate: moment().subtract(6, 'day'),
      endDate: moment()
    }
  };

  $scope.query = {
    ids: 'ga:' + item.analytics.profileId,  // put your viewID here
    metrics: 'ga:pageviews',
    dimensions: 'ga:source, ga:date',
    legend:false,
    type: "plot"
  };


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