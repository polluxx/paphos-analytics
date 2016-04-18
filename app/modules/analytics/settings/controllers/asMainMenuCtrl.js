export default
class asMainMenuCtrl {
  /*@ngInject*/
  constructor($scope, aSiteModel) {

    $scope.current = {
      site: null,
      date: {
        startDate: moment().subtract(6, 'day'),
        endDate: moment()
      }
    };

    var sites = [
      {siteUrl: 'http://v-androide.com/'},
      {siteUrl: 'http://vseowode.ru/'}
    ];

    var loadSites = () => {
      $scope.hasUnknown = false;
      aSiteModel.find(_.pluck(sites, 'siteUrl'), res => {
        $scope.sites = res;

        $scope.hasUnknown = _.filter(res, { isUnknown: true }).length > 0;
      });
    };
    loadSites();

  }
}