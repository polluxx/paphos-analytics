var appName = 'module.analytics.projects';

let module = angular.module(appName, [
]);

// controllers
import apProjectViewCtrl from './controllers/apProjectViewCtrl.js';
import apProjectPagesCtrl from './controllers/apProjectPagesCtrl.js';
import apPagesViewCtrl from './controllers/apPagesViewCtrl.js';
import apPagesTopCtrl from './controllers/apPagesTopCtrl.js';
import apPagesPositionsCtrl from './controllers/apPagesPositionsCtrl.js';

module
  .controller('apProjectViewCtrl', apProjectViewCtrl)
  .controller('apProjectPagesCtrl', apProjectPagesCtrl)
  .controller('apPagesViewCtrl', apPagesViewCtrl)
  .controller('apPagesTopCtrl', apPagesTopCtrl)
  .controller('apPagesPositionsCtrl', apPagesPositionsCtrl)
;

// config
module.config(function($stateProvider) {

});

export default appName;