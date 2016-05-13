var appName = "module.analytics.directives";

let module = angular.module(appName, []);

import analyticsGaReport from './directives/analyticsGaReport.js';
import loading from './directives/loading.js';

module.directive('analyticsGaReport', analyticsGaReport);
module.directive('loading', loading);

export default appName;
