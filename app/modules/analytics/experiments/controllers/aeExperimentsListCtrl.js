export default
  /*@ngInject*/
  function($scope, aExperimentModel) {

    var loadExperiments = () => {
      aExperimentModel.query({ page: 1, perPage: 100 }, res => {
        $scope.experiments = res;
      });
    };
    loadExperiments();

  }