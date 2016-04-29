export default
/*@ngInject*/
function($stateProvider, $urlRouterProvider) {

  $stateProvider
    .state('analytics', {
      parent: 'private',
      abstract: true,
      url: '/analytics',
      views: {
        'master-view': {templateUrl: 'app/views/masters/service.html'}
      }
    })

    .state('experiments', {
      url: '/experiments',
      parent: 'analytics',
      views: {
        'main-content': {controller: 'aeExperimentsListCtrl', templateUrl: 'app/views/analytics/experiments/page-list.html'}
      }
    })

    .state('analytics.dashboard', {
      url: '',
      views: {
        'main-content': {controller: 'adDashboardCtrl', templateUrl: 'app/views/analytics/dashboard/page-dashboard.html'}
      }
    })
    .state('analytics.dashboard.new-project', {
      url: '/new-project',
      onEnter: function($stateParams, $state, $uibModal) {
        $uibModal.open({
          backdropClass: 'modal-backdrop',
          windowClass: 'modal-right',
          animation: true,
          templateUrl: 'app/views/analytics/dashboard/modal-project.html',
          resolve: {
            item: function(aSiteModel) { return new aSiteModel() }
          },
          controller: 'adEditProjectModelCtrl'
        }).result.finally(() => $state.go('^'));
      }
    })
    .state('analytics.project', {
      url: '/:projectId',
      abstract: true,
      views: {
        'main-content': {controller: 'apProjectViewCtrl', templateUrl: 'app/views/analytics/projects/page-project.html'}
      },
      resolve: {
        item: (aSiteModel, $stateParams) => aSiteModel.get({ _id: $stateParams.projectId }).$promise
      }
    })
    .state('analytics.project.info', {
      url: '/info',
      templateUrl: 'app/views/analytics/projects/page-info.html'
    })
    .state('analytics.project.pages', {
      url: '/pages',
      controller: 'apProjectPagesCtrl',
      templateUrl: 'app/views/analytics/projects/page-pages.html'
    })
    .state('analytics.project.top', {
      url: '/project/:projectId/top',
      controller: 'apPagesTopCtrl',
      templateUrl: 'app/views/analytics/projects/page-top.html',
      resolve: {
        items: (aPageModel, $stateParams) => aPageModel.query({page: 1, perPage: 10}).$promise,
        project: (aSiteModel, $stateParams) => aSiteModel.get({ _id: $stateParams.projectId }).$promise
      }
    })
    .state('analytics.project.positions', {
      url: '/positions',
      templateUrl: 'app/views/analytics/projects/page-positions.html'
    })

    .state('pages', {
      parent: 'analytics',
      url: '/project/:projectId/page/:pageId',
      views: {
        'main-content': {controller: 'apPagesViewCtrl', templateUrl: 'app/views/analytics/projects/page-statistic.html'}
      },
      resolve: {
        item: (aPageModel, $stateParams) => aPageModel.get({ _id: $stateParams.pageId }).$promise,
        project: (aSiteModel, $stateParams) => aSiteModel.get({ _id: $stateParams.projectId }).$promise
      }
    })

    .state('experiments.new-experiment', {
      url: '/new-experiment',
      onEnter: ($stateParams, $state, $uibModal) => {
        $uibModal.open({
          backdropClass: 'modal-backdrop',
          windowClass: 'modal-right',
          animation: true,
          templateUrl: 'app/views/analytics/experiments/modal-experiment.html',
          resolve: {
            item: aExperimentModel => new aExperimentModel({
              variableParameterName: 'title',
              trackingParameterName: 'query',
              trackingTime: 'month'
            })
          },
          controller: 'aeEditExperimentModelCtrl'
        }).result.finally(() => $state.go('^'));
      }
    })

    .state('experiment', {
      url: '/experiments/:experimentId',
      parent: 'analytics',
      views: {
        'main-content': {controller: 'aeExperimentCtrl', templateUrl: 'app/views/analytics/experiments/page-experiment.html'}
      },
      resolve: {
        item: (aExperimentModel, $stateParams) => aExperimentModel.get({ _id: $stateParams.experimentId })
      }
    })


    .state('experiment.new-url', {
      url: '/new-url',
      onEnter: ($stateParams, $state, $uibModal) => {
        $uibModal.open({
          backdropClass: 'modal-backdrop',
          windowClass: 'modal-right',
          animation: true,
          templateUrl: 'app/views/analytics/experiments/modal-experimentUrl.html',
          resolve: {
            experiment: aExperimentModel => aExperimentModel.get({ _id: $stateParams.experimentId }),
            item: aExperimentUrlModel => new aExperimentUrlModel({
              experimentId: $stateParams.experimentId,
              period: {
                startDate: moment(),
                endDate: moment().add(7, 'day')
              }
            })
          },
          controller: 'aeEditExperimentUrlCtrl'
        }).result.finally(() => $state.go('^'));
      }
    })

    .state('analytics.dashboard.settings', {
      url: '/settings',
      onEnter: function($stateParams, $state, $uibModal) {
        $uibModal.open({
          backdropClass: 'modal-backdrop',
          windowClass: 'modal-right',
          animation: true,
          templateUrl: 'app/views/analytics/dashboard/modal-settings.html',
          resolve: {
            item: function(aSiteModel) { return new aSiteModel() }
          },
          controller: 'asSettingsCtrl'
        }).result.finally(() => $state.go('^'));
      }
    })
  ;
};