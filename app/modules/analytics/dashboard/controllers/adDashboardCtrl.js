export default
/*@ngInject*/
function ($scope, aSiteModel) {

  // get sites list
  aSiteModel.find({}, function(res) {
    $scope.sites = res;
    
    $scope.hasUnknown = _.filter(res, {isUnknown: true}).length > 0;
  });
}