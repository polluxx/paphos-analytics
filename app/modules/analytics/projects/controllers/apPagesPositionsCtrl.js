export default
/*@ngInject*/
function($scope, project, NgTableParams, aKeywordModel, aPageModel, $stateParams, $timeout) {
  $scope.loading = true;

  $scope.current = {
    date: {
      from: moment().subtract(5, 'days'),
      to: moment()
    }
  };

  $scope.refreshKeys = (cb) => {
    $scope.loading = true;
    aPageModel.sendTask({subtask: 'pages.keywords'}, function (resp) {
      console.log(resp);

      $timeout(function(){
        $scope.loading = false;
      }, 2000);
      if(cb !== undefined) cb(null, resp.message);
    });
  };


  $scope.tableParams = new NgTableParams({
    page: 1,
    count: 10
  }, {
    getData: function (params) {
      var dateFrom = $scope.current.date.from.format('YYYY-MM-DD'),
        dateTo = $scope.current.date.to.format('YYYY-MM-DD'),
        dates = [];

      for (var date = moment($scope.current.date.from); date.isSameOrBefore($scope.current.date.to); date.add(1, 'day')) {
        dates.push(date.format('DD.MM.YYYY'))
      }
      $scope.dates = dates;

      return aKeywordModel.query({
        page: parseInt(params.page()),
        perPage: parseInt(params.count()),
        siteId: project._id,
        dateFrom: dateFrom,
        dateTo: dateTo
      }, function (resp, headers) {
        $scope.loading = false;
        $scope.pages = resp;

        params.total(parseInt(headers('x-total-count')));
        return $scope.pages;

      }).$promise;
    },
    paginationMaxBlocks: 10,
    paginationMinBlocks: 2
  });
}