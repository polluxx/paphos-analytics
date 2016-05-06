export default
/*@ngInject*/
function ($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams) {

  $scope.refreshPages = (cb) => {
    aPageModel.refresh({_id: item._id},function (resp) {
      cb(null, resp.message);
    });
  };

  $scope.item = item;
  $scope.total = 0;

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

  // $scope.$watch('tableParams.data', (data) => {
  //   console.log($scope.tableParams);
  // });

  var total = $scope.tableParams.total();
  $scope.$watch('total', () => {
    if($scope.total !== total) {
      $scope.tableParams.total($scope.total);
      total = $scope.tableParams.total();
      $scope.tableParams.reload();
    }
  });
}