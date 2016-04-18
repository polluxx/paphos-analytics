export default
  /*@ngInject*/
  function($scope, item) {

    $scope.item = item;

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