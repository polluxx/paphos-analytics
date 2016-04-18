export default
  /*@ngInject*/
  function($scope, item, experiment, aSiteModel) {

    $scope.experiment = experiment;
    $scope.item = item;
console.info(experiment)
    aSiteModel.query({ page:1, perPage: 100 }, data => {
      $scope.projects = data;
    });

    $scope.saveItem = (item) => {
      var savedItem = angular.copy(item);

      let saveFunc = savedItem._id ? savedItem.$save : savedItem.$create;

      $scope.loading = true;
      return saveFunc.call(item, res => {
        $scope.$close();
      }, () => {
        $scope.loading = false;
      });
    };

  }