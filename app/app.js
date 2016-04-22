import config from './config';
import modules from './modules/modules.config';
import baseApp from './base/base';

let appName = 'gaanalytics';

try {
  angular.module('views');
} catch (e) {
  angular.module('views', []);
}

window.config = config;

angular.module(appName, [baseApp, 'views', 'ngTable'].concat(modules));

export default appName;