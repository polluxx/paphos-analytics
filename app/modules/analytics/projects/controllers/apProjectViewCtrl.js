export default
  /*@ngInject*/
  function($scope, item, ngAnalyticsService, aSiteModel) {

    console.log(item);

    item.token = {profile_id: item.analytics.profileId};
    item.id = item._id;
    angular.extend($scope, {
      item: item,
      current: {
        site: item.siteUrl,
        date: {
          startDate: moment().subtract(6, 'day'),
          endDate: moment()
        }
      },
      query: {
        ids: 'ga:'+item.analytics.profileId,  // put your viewID here
        metrics: 'ga:pageviews',
        dimensions: 'ga:source, ga:date'
      },
      getAuth: function() {
        if (!item.tokens) return reject('No tokens provided!');

        $scope.$watch(() => ngAnalyticsService.isReady, isReady => {
          if(isReady) {
            ngAnalyticsService.setToken(item.tokens.access_token);
            ngAnalyticsService.authorize();

            this.getYandexUpdates();
          }
        });
      },
      getYandexUpdates: function() {
        aSiteModel.yandexUpdates(function(resp) {
          if(!resp || resp.status != 200) {
            console.error("Error on response");
            return;
          }

          $scope.item.yandexUpdates = JSON.parse(resp.body);
        });
      },
      getPages: function() {

      }
    });

    $scope.getAuth();
  }