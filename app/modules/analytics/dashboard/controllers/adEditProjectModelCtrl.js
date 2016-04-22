export default
  /*@ngInject*/
  function($scope, item) {

    $scope.item = item;

    $scope.saveItem = function(item) {
      var savedItem = angular.copy(item);
      if(!savedItem['siteUrl']) return;

      savedItem['id'] = savedItem['siteUrl'];

      let saveFunc = _.pluck(savedItem, '_id') ? savedItem.$save : savedItem.$create;

      $scope.loading = true;
      return saveFunc.call(item, res => {
        $scope.$close();
      }, () => {
        $scope.loading = false;
        $scope.tableParams.reload();
      });
    };

  }