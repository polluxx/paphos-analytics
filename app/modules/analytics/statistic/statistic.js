var appName = 'module.analytics.statistic';

let module = angular.module(appName, [
]);

// controllers
import asStatisticCtrl from './controllers/asStatisticCtrl.js';
import asStatisticPageCtrl from './controllers/asStatisticPageCtrl.js';

module
  .controller('asStatisticCtrl', asStatisticCtrl)
  .controller('asStatisticPageCtrl', asStatisticPageCtrl)
;

// config
module.config(($stateProvider) => {

});

export default appName;