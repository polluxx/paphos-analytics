export default
  /*@ngInject*/
  function($scope, item, aExperimentUrlModel) {

    $scope.item = item;

    aExperimentUrlModel.query({ page: 1, perPage: 100 }, data => {
      $scope.urls = data;
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