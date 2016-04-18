var appName = 'module.analytics.projects';

let module = angular.module(appName, [
]);

// controllers
import apProjectViewCtrl from './controllers/apProjectViewCtrl.js';

module
  .controller('apProjectViewCtrl', apProjectViewCtrl)
;

// config
module.config(($stateProvider) => {

});

export default appName;