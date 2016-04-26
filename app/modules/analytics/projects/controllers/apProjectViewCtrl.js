

export default
  /*@ngInject*/
  function($scope, item, ngAnalyticsService, aSiteModel, $http, NgTableParams) {
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

            return $http({method: 'GET', url: "http://" + item.siteUrl + "/api/posts?page=1&perPage=100&fields=category,alias,title"})
              .then(function (resp) {
                $scope.pages = resp.data;
                console.log($scope.pages);

                params.total(1 * params.count());
                console.log(params);
                return $scope.pages;
              });
          }
      });
      }
    });

    $scope.getAuth();

    $scope.pages = $scope.getPages();
  }