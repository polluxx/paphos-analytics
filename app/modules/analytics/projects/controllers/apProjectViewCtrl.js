export default
  /*@ngInject*/
  function($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams) {
    console.log(item);
    if(!item.analytics) return;

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
        if (!item.tokens) return console.error('No tokens provided!');

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
        this.tableParams = new NgTableParams({}, {
          getData: function(params) {
            return aPageModel.query({ page: 1, perPage: 100/*, 'siteId': item._id*/}, function(resp) {
              $scope.pages = resp;
              params.total(1 * params.count());
              return $scope.pages;
            });
          }
        });
      },
      refreshPages: function() {
        aPageModel.refresh(function(resp) {
          console.log(resp);
        });
      }
    });

    $scope.getAuth();

    $scope.pages = $scope.getPages();
  }