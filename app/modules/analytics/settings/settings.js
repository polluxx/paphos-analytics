var appName = 'module.analytics.settings';

let module = angular.module(appName, [
]);

// controllers
import asSettingsCtrl from './controllers/asSettingsCtrl.js';
import asMainMenuCtrl from './controllers/asMainMenuCtrl.js';

module
  .controller('asMainMenuCtrl', asMainMenuCtrl)
  .controller('asSettingsCtrl', asSettingsCtrl)
;

// config
module.config(($stateProvider) => {

});

export default appName;