var appName = 'module.analytics.dashboard';

let module = angular.module(appName, [
]);

// controllers
import adDashboardCtrl from './controllers/adDashboardCtrl.js';
import adEditProjectModelCtrl from './controllers/adEditProjectModelCtrl.js';

module
  .controller('adDashboardCtrl', adDashboardCtrl)
  .controller('adEditProjectModelCtrl', adEditProjectModelCtrl)
;

// config
module.config(($stateProvider) => {

});

export default appName;