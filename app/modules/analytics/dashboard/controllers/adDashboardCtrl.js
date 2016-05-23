export default
/*@ngInject*/
function ($scope, aSiteModel, aVisitModel) {

  // get sites list
  aSiteModel.find({}, function(res) {
    $scope.sites = res;
    $scope.analytics = {};

    var siteIds = $scope.sites.map(site => {
      return site._id;
    });

    var dateTo = moment(Date.now()).add(1, 'day').format('YYYY-MM-DD'),
    dateFrom = moment(dateTo).subtract(2, 'day').format('YYYY-MM-DD');
    aVisitModel.analytics({ids:siteIds, dateFrom: dateFrom, dateTo: dateTo}, analytics => {
      $scope.analytics = analytics;
    });

    $scope.hasUnknown = _.filter(res, {isUnknown: true}).length > 0;
  });




}