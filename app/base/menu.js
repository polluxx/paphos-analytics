export default
/*@ngInject*/
($rootScope) => {

  $rootScope.mainMenu = _.filter(settings.dashboard.services, function(item) {
    return item.name != 'base';
  });

};