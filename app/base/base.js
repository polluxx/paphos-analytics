let appName = 'base';

var module = angular.module(appName,
  [
    'ui.router',
    'ngAnimate',
    'ngMessages',
    'ngCookies',
    'ngAnalytics',
    'permission',
    'satellizer',
    'ui.bootstrap',
    'pascalprecht.translate',
    'checklist-model',
    'toaster'
  ]
);

import routesConfig from './routes.js';

module.config(routesConfig);

export default appName;