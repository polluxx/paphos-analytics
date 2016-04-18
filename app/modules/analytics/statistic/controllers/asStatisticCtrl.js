export default
class asStatisticCtrl {
  /*@ngInject*/
  constructor($scope, aVisitModel, aSiteModel, ngAnalyticsService, $timeout) {

    $scope.current = {
      site: null,
      date: {
        startDate: moment().subtract(6, 'day'),
        endDate: moment()
      }
    };


    var sites = [
      {siteUrl: 'http://v-androide.com/'},
      {siteUrl: 'http://vseowode.ru/'}
    ];

    var loadSites = () => {
      $scope.hasUnknown = false;
      aSiteModel.find(_.pluck(sites, 'siteUrl'), res => {
        $scope.sites = res;

        $scope.hasUnknown = _.filter(res, { isUnknown: true }).length > 0;
      });
    };
    loadSites();


    var updateCharts = () => {
      $scope.isReady = false;
      if (!$scope.current.site) {
        return;
      }

      var start = $scope.current.date.startDate.format('YYYY-MM-DD'),
        end = $scope.current.date.endDate.format('YYYY-MM-DD');

      aVisitModel.getGrownUp({ date_from: start, date_to: end, 'site._id': $scope.current.site._id }, data => {
        $scope.grownUp = data;
      });
      aVisitModel.getDropIn({ date_from: start, date_to: end, 'site._id': $scope.current.site._id }, data => {
        $scope.dropIn = data;
      });

      var profileId = 'ga:' + $scope.current.site.analytics.profileId;
      $scope.profileId = profileId;

      $scope.defaultIds = {
        ids: profileId
      };

      $scope.extraChart = {
        reportType: 'ga',
        query: {
          metrics: 'ga:sessions,ga:users',
          dimensions: 'ga:date',
          'start-date': $scope.current.date.startDate.format('YYYY-MM-DD'),
          'end-date': $scope.current.date.endDate.format('YYYY-MM-DD'),
          ids: profileId
        },
        chart: {
          container: 'chart-container-3',
          type: 'LINE',
          options: {
            width: '100%'
          }
        }
      };

      $timeout(function() {
        $scope.isReady = true;
      }, 10);
    };

    $scope.$watch('current.site._id', siteId => {
      if (!siteId) {
        return;
      }
      var tokens = $scope.current.site.tokens;
      if (tokens.access_token) {
        ngAnalyticsService.serviceAuthToken = tokens.access_token;
        ngAnalyticsService.authorize();
      }

      updateCharts();
    });

    $scope.$watch(() => $scope.current.site && ngAnalyticsService.isReady, isReady => {
      $scope.isReady = isReady;
    });

    $scope.$watch('current.date', date => {
      updateCharts();
    }, true);

  }
}