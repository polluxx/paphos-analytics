export default
  /*@ngInject*/
  function($scope, item) {

    $scope.trackingParameters = {
      query: 'Запрос',
      frequence: 'Частотность',
      yandexPosition: 'Позиция в Яндексе',
      googlePosition: 'Позиция в Google',
      yandexTraffic: 'Трафик по Яндекс',
      googleTraffic: 'Трафик по Google',
      traffic: 'Общий трафик'
    };
    $scope.trackingParametersKeys = _.keys($scope.trackingParameters);

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