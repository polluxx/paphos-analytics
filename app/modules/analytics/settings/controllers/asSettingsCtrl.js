export default
class asSettingsCtrl {
  /*@ngInject*/
  constructor($scope, $http, $timeout, ngAnalyticsService, SatellizerPopup, $auth, aSiteModel, aAuthModel) {

    $scope.authenticate = function (provider) {
      $auth.authenticate(provider).then(data => {
        console.info(data)
      }).catch(function (res) {
        console.info(res.data)
      });
    };

    $scope.user = {};


    $scope.signIn = () => {
      aAuthModel.signIn();
    };

    $scope.updateSite = (site) => {
      aSiteModel.updateSite({ _id: site._id }, site, res => {

      });
    };

    $scope.scanSite = (site) => {
      aSiteModel.scanSite({ _id: site._id }, res => {

      });
    };

    $scope.getPages = (site) => {

      $scope.selectedSite = null;
      aSiteModel.get({ _id: site._id }, res => {
        ngAnalyticsService.serviceAuthToken = res.tokens.access_token;
        ngAnalyticsService.authorize();

        $scope.charts = [{
          reportType: 'ga',
          query: {
            metrics: 'ga:sessions',
            dimensions: 'ga:date',
            'start-date': '30daysAgo',
            'end-date': 'yesterday',
            ids: 'ga:' + site.analytics.profileId
          },
          chart: {
            container: 'chart-container-1',
            type: 'LINE',
            options: {
              width: '100%'
            }
          }
        }, {
          reportType: 'ga',
          query: {
            metrics: 'ga:sessions',
            dimensions: 'ga:browser',
            'start-date': '30daysAgo',
            'end-date': 'yesterday',
            ids: 'ga:' + site.analytics.profileId
          },
          chart: {
            container: 'chart-container-2',
            type: 'PIE',
            options: {
              width: '100%',
              is3D: true,
              title: 'Browser Usage'
            }
          }
        }];
        $scope.extraChart = {
          reportType: 'ga',
          query: {
            metrics: 'ga:sessions',
            dimensions: 'ga:date',
            'start-date': '30daysAgo',
            'end-date': 'yesterday',
            ids: 'ga:' + site.analytics.profileId
          },
          chart: {
            container: 'chart-container-3',
            type: 'LINE',
            options: {
              width: '100%'
            }
          }
        };
        $scope.defaultIds = {
          ids: 'ga:' + site.analytics.profileId
        };
        $scope.queries = [{
          query: {
            ids: 'ga:' + site.analytics.profileId,
            metrics: 'ga:sessions',
            dimensions: 'ga:city'
          }
        }];

        $timeout(function () {
          $scope.selectedSite = site;
        }, 1);

      });

      $http.get('http://analytics.5stars.link/api/pages?site._id=' + site._id).then((res) => {
        $scope.pages = res.data;
      });
    };

    $scope.getQueries = (page) => {
      var keywords = {};
      $http.get('http://analytics.5stars.link/api/statistics?page._id=' + page._id + '&sort=clicks').then((res) => {

        _.each(res.data, (item) => {
          keywords[item.query.keyword] = keywords[item.query.keyword] || {};
          keywords[item.query.keyword][item.date] = item.position;
        });
        $scope.queries = keywords;
        console.info(keywords)
      });
    };

    $scope.$on('$gaReportSuccess', function (e, report, element) {
      console.log(report, element);
    });
  }
}