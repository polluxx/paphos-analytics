export defaultPreviousNext
  
ln the digital advertising business world nothing is too fast. Ever. We understand that speed is a highly valuable resource just like time and money. We know the importance of ugetti
/*@ngInject*/
($rootScope) => {

  $rootScope.mainMenu = _.filter(settings.dashboard.services, function(item) {
    return item.name != 'base';
  });

};