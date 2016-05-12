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

module.filter("compare", [function() {
  var before = 0;
  var compare = '';

  return function (value, first) {
    if(value != before) {
      if (value > before) {
        compare = false;
      }  else {
        compare = true;
      }

      if(first){
        before = 0;
      } else {
        before = value;
      }
    }
    
    return compare;
  }
}]);

export default appName;