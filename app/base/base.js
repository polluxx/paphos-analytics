let appName = 'base';

var module = angular.module(appName,
  [
    'ui.router'
  ]
);

import MainServiceCtrl from './MainServiceCtrl.js';

module.controller('MainServiceCtrl', MainServiceCtrl);

import routesConfig from './routes.js';

module.config(routesConfig);

export default appName;