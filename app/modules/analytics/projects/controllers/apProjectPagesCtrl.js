export default
/*@ngInject*/
function ($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams, ngTableEventsChannel, $timeout, $stateParams) {

  $scope.refreshPages = (cb) => {
    aPageModel.refresh({_id: item._id},function (resp) {
      cb(null, resp.message);
    });
  };

  $scope.paginationPage = $stateParams.paginationPage;
  $scope.paginationCount = $stateParams.paginationCount;

  $scope.item = item;
  $scope.total = 0;
  $scope.dataMightReload = false;

  $scope.tableParams = new NgTableParams({
  page: $scope.paginationPage,
  count: $scope.paginationCount || $scope.counter
  }, {
    getData: function (params) {
      return aPageModel.query({page: params.page(), perPage: params.count(), siteId: item._id}, function (resp, headers) {
        $scope.counter = params.count();
        $scope.paginationPage = params.page();
        $scope.paginationCount = params.count();
        $scope.pages = resp;
        $scope.total = parseInt(headers('x-total-count'));
        params.total($scope.total);

        // check if no results
        if(!resp.length) $scope.dataMightReload = true;

        return $scope.pages;
      });
    },
    paginationMaxBlocks: 10,
    paginationMinBlocks: 2
  });

  $scope.$watch('dataMightReload', result => {
    if(!result) return;
    $scope.loading = true;
    $scope.refreshPages(() => {
        $timeout(()=>{
          console.log('reload');
          $scope.loading = false;
          $scope.tableParams.reload();
        }, 2000);
    });
  });

  var total = $scope.tableParams.total();
  $scope.$watch('total', () => {
    if($scope.total !== total) {
      $scope.tableParams.total($scope.total);
      total = $scope.tableParams.total();
      $scope.tableParams.reload();
    }
  });
}