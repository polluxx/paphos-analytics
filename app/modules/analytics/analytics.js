import models from './models/models';
import dashboard from './dashboard/dashboard';
import projects from './projects/projects';
import settings from './settings/settings';
import statistic from './statistic/statistic';
import experiments from './experiments/experiments';
import directives from './directives/directives';

var appName = 'module.analytics';

var module = angular.module(appName, [
  'chart.js',
  models,
  dashboard,
  projects,
  settings,
  experiments,
  statistic,
  directives
]);

import routes from './routes';

module
  .config(routes)
;

export default appName;