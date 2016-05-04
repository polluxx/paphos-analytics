export default
/*@ngInject*/
function ($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams) {

  $scope.refreshPages = () => {
    aPageModel.refresh({_id: item._id},function (resp) {
      console.log(resp);
    });
  };

  $scope.item = item;

  $scope.tableParams = new NgTableParams({
    page: 1,
    count: $scope.counter || 100
  }, {
    getData: function (params) {
      return aPageModel.query({page: params.page(), perPage: params.count(), siteId: item._id}, function (resp, headers) {
        $scope.counter = params.count();
        $scope.pages = resp;
        params.total(headers()['x-total-count']);
        return $scope.pages;
      });
    }
  });
}