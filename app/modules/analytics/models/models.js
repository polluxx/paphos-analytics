var appName = 'module.analytics.models';

var module = angular.module(appName, [
  'ngResource'
]);

module.constant('ANALYTICS_API', '{{API_URL}}');


// models
import aAuthModel from './aAuthModel.js';
import aSiteModel from './aSiteModel.js';
import aTempSiteModel from './aTempSiteModel.js';
import aPageModel from './aPageModel.js';
import aVisitModel from './aVisitModel.js';
import aExperimentModel from './aExperimentModel.js';
import aExperimentUrlModel from './aExperimentUrlModel.js';
import aKeywordModel from './aKeywordModel.js';

module
  .factory('aAuthModel', aAuthModel)
  .factory('aPageModel', aPageModel)
  .factory('aSiteModel', aSiteModel)
  .factory('aTempSiteModel', aTempSiteModel)
  .factory('aVisitModel', aVisitModel)
  .factory('aExperimentModel', aExperimentModel)
  .factory('aExperimentUrlModel', aExperimentUrlModel)
  .factory('aKeywordModel', aKeywordModel)
;

export default appName;