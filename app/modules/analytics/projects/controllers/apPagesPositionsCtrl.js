export default
/*@ngInject*/
function($scope, project, NgTableParams, aKeywordModel, aPageModel, $stateParams) {
  $scope.paginationPage = $stateParams.paginationPage;
  $scope.paginationCount = $stateParams.paginationCount;

  $scope.refreshKeys = (cb) => {
    aPageModel.sendTask({subtask: 'pages.keywords'}, function (resp) {
      console.log(resp);
      if(cb !== undefined) cb(null, resp.message);
    });
  };


  $scope.tableParams = new NgTableParams({
    page: $scope.paginationPage,
    count: $scope.paginationCount || $scope.counter
  }, {
    getData: function (params) {
      return aKeywordModel.query({page: params.page(), perPage: params.count(), siteId: project._id}, function (resp, headers) {
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
