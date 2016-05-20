export default
/*@ngInject*/
function ($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams, ngTableEventsChannel, $timeout, $stateParams) {

  $scope.refreshPages = (cb) => {
    aPageModel.refresh({_id: item._id},function (resp) {
      if(cb) cb(null, resp.message);
    });
  };

  $scope.search = '';

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
      return aPageModel.query({page: parseInt(params.page()), perPage: parseInt(params.count()), siteId: item._id, search: $scope.search}, function (resp, headers) {
        $scope.counter = params.count();
        $scope.paginationPage = params.page();
        $scope.paginationCount = params.count();
        $scope.pages = resp;
        $scope.total = parseInt(headers('x-total-count'));
        params.total($scope.total);

        // check if no results
        if(!resp.length) $scope.dataMightReload = true;

        return $scope.pages;
      }).$promise;
    },
    paginationMaxBlocks: 10,
    paginationMinBlocks: 2
  });

  $scope.$watch("search", function (search) {
    if(search.length < 2) return;

    $scope.tableParams.reload();
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
}