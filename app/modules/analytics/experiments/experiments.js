var appName = 'module.analytics.experiments';

let module = angular.module(appName, [
]);

// controllers
//import aeExperimentsListCtrl from './controllers/aeExperimentsListCtrl.js';
import aeExperimentCtrl from './controllers/aeExperimentCtrl.js';
//import aeEditExperimentModelCtrl from './controllers/aeEditExperimentModelCtrl.js';
import aeEditExperimentUrlCtrl from './controllers/aeEditExperimentUrlCtrl.js';

module
  // .controller('aeExperimentsListCtrl', aeExperimentsListCtrl)
  .controller('aeExperimentCtrl', aeExperimentCtrl)
  //.controller('aeEditExperimentModelCtrl', aeEditExperimentModelCtrl)
  .controller('aeEditExperimentUrlCtrl', aeEditExperimentUrlCtrl)
;

// config
module.config(($stateProvider) => {

});

export default appName;