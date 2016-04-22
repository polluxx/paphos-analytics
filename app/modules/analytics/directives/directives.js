var appName = "module.analytics.directives";

let module = angular.module(appName, []);

import analyticsGaReport from './directives/analyticsGaReport.js';

module.directive('analyticsGaReport', analyticsGaReport);

export default appName;
