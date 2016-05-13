export default
/*@ngInject*/
function($scope, project, NgTableParams, aKeywordModel, aPageModel, $stateParams, $timeout) {
  $scope.paginationPage = $stateParams.paginationPage;
  $scope.paginationCount = $stateParams.paginationCount;

  $scope.loading = true;

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
    page: $scope.paginationPage,
    count: $scope.paginationCount || $scope.counter
  }, {
    getData: function (params) {
      return aKeywordModel.query({page: parseInt(params.page()), perPage: parseInt(params.count()), siteId: project._id}, function (resp, headers) {
        $scope.loading = false;
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
