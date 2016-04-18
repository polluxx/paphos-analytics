export default
class asStatisticPageCtrl {
  /*@ngInject*/
  constructor($scope, page, $timeout) {


    console.info(page);

    var updateCharts = () => {
      $scope.isReady = false;
      if (!$scope.current.site) {
        return;
      }

      $scope.extraChart = {
        reportType: 'ga',
        query: {
          metrics: 'ga:sessions,ga:users',
          dimensions: 'ga:date',
          'start-date': $scope.current.date.startDate.format('YYYY-MM-DD'),
          'end-date': $scope.current.date.endDate.format('YYYY-MM-DD'),
          ids: $scope.profileId,
          filters: 'ga:pagePath==' + page.url
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

    $scope.$watch('current.date', date => {
      updateCharts();
    }, true);

  }
}