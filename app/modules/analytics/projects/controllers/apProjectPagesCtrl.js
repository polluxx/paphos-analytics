export default
/*@ngInject*/
function ($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams, ngTableEventsChannel, $timeout) {

  $scope.refreshPages = (cb) => {
    aPageModel.refresh({_id: item._id},function (resp) {
      cb(null, resp.message);
    });
  };

  $scope.item = item;
  $scope.total = 0;
  $scope.dataMightReload = false;

  $scope.tableParams = new NgTableParams({
    page: 1,
    count: $scope.counter || 10
  }, {
    getData: function (params) {
      return aPageModel.query({page: params.page(), perPage: params.count(), siteId: item._id}, function (resp, headers) {
        $scope.counter = params.count();
        $scope.pages = resp;
        $scope.total = parseInt(headers('x-total-count'));
        params.total($scope.total);
        return $scope.pages;
      });
    },
    paginationMaxBlocks: 10,
    paginationMinBlocks: 2
  });

  ngTableEventsChannel.onAfterReloadData((evt) => {
    evt.data.$promise.then((resp)=>{
      console.log(resp);
      if(!resp.length) $scope.dataMightReload = true;
    });
  }, $scope);

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