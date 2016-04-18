export default
/*@ngInject*/
function($stateProvider, $urlRouterProvider) {

console.info('asd')
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
        item: (aSiteModel, $stateParams) => aSiteModel.get({ _id: $stateParams.projectId })
      }
    })
    .state('analytics.project.info', {
      url: '',
      templateUrl: 'app/views/analytics/projects/page-info.html'
    })
    .state('analytics.project.pages', {
      url: '/pages',
      templateUrl: 'app/views/analytics/projects/page-pages.html'
    })
    .state('analytics.project.positions', {
      url: '/positions',
      templateUrl: 'app/views/analytics/projects/page-positions.html'
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
  ;
};