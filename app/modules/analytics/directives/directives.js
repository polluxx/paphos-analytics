var appName = "module.analytics.directives";

let module = angular.module(appName, []);

import analyticsGaReport from './directives/analyticsGaReport.js';
import loading from './directives/loading.js';
import daterange from './directives/daterange.js';

module.directive('analyticsGaReport', analyticsGaReport);
module.directive('loading', loading);
module.directive('daterange', daterange);

export default appName;
