export default
/*@ngInject*/
function ($scope, aSiteModel, aVisitModel) {

  // get sites list
  aSiteModel.find({}, function(res) {
    $scope.sites = res;

    var siteIds = $scope.sites.map(site => {
      return site._id;
    });

    // aVisitModel.analytics({ids:siteIds}, res => {
    //   console.log('visitss', res);
    // });


    $scope.hasUnknown = _.filter(res, {isUnknown: true}).length > 0;
  });




}