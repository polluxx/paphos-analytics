var appName = 'module.analytics.projects';

let module = angular.module(appName, [
]);

// controllers
import apProjectViewCtrl from './controllers/apProjectViewCtrl.js';
import apPagesViewCtrl from './controllers/apPagesViewCtrl.js';

module
  .controller('apProjectViewCtrl', apProjectViewCtrl)
  .controller('apPagesViewCtrl', apPagesViewCtrl)
;

// config
module.config(function($stateProvider) {

});

export default appName;