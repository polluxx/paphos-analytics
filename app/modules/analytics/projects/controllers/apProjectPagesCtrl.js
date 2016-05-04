export default
/*@ngInject*/
function ($scope, item, ngAnalyticsService, aSiteModel, aPageModel, NgTableParams) {

  $scope.refreshPages = () => {
    aPageModel.refresh({_id: item._id},function (resp) {
      console.log(resp);
    });
  };

  $scope.tableParams = new NgTableParams({
    page: 1
  }, {
    getData: function (params) {
      return aPageModel.query({page: params.page(), perPage: 100, siteId: item._id}, function (resp) {
        $scope.pages = resp;
        params.total(1 * params.count());
        return $scope.pages;
      });
    }
  });

  console.info( $scope.tableParams)
}