export default
/*@ngInject*/
function($scope, NgTableParams, aKeywordModel, $stateParams) {
  $scope.paginationPage = $stateParams.paginationPage;
  $scope.paginationCount = $stateParams.paginationCount;

  $scope.tableParams = new NgTableParams({
    page: $scope.paginationPage,
    count: $scope.paginationCount || $scope.counter
  }, {
    getData: function (params) {
      return aKeywordModel.query({page: params.page(), perPage: params.count()}, function (resp, headers) {
        $scope.counter = params.count();
        $scope.paginationPage = params.page();
        $scope.paginationCount = params.count();
        $scope.pages = resp;
        $scope.total = parseInt(headers('x-total-count'));
        params.total($scope.total);
        console.log(resp);
        return $scope.pages;
        
      });
    },
    paginationMaxBlocks: 10,
    paginationMinBlocks: 2
  });

}