var config = {};

function aAuthModel($resource, ANALYTICS_API, SatellizerPopup, $window) {
  var resource = $resource(ANALYTICS_API + '/auth/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'},

    'authGoogle': {method: 'GET', params: { method: 'google' }}
  });

  resource.signIn = (callback) => {
    callback = callback || angular.noop;

    resource.authGoogle(res => {

      var openPopup = SatellizerPopup.open(res.url, 'Google Auth', { width: 452, height: 633 }, $window.location.origin).pollPopup();
      console.log(openPopup);
      openPopup.then(function(token) {
        callback(token);
      })
      .catch(function(err) {
        console.log(err);
      });
    });
  };

  return resource;
}

function aSiteModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/sites/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'},

    'updateSite': {method: 'PUT'},
    'scanSite': {method: 'POST', params: { method: 'scan' }},

    'find': {method: 'POST', params: { method: 'find' }, isArray: true },

    'yandexUpdates': {method: 'GET', params: { method: 'yandexUpdates' }, isArray: false}
  });

  return resource;
}

function aPageModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/pages/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'}
  });

  return resource;
}

function aVisitModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/visits/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'},

    'getGrownUp': {method: 'GET', params: { method: 'grown-up' }, isArray: true},
    'getDropIn': {method: 'GET', params: { method: 'drop-in' }, isArray: true}
  });

  return resource;
}

function aExperimentModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/experiments/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'}
  });

  return resource;
}

function aExperimentUrlModel($resource, ANALYTICS_API) {
  var resource = $resource(ANALYTICS_API + '/experimentUrls/:_id/:method', {
    '_id': '@_id'
  }, {
    'get': {method: 'GET'},
    'save': {method: 'PUT'},
    'create': {method: 'POST'},
    'update': {method: 'PATCH'}
  });

  return resource;
}

var appName$2 = 'module.analytics.models';

var module$2 = angular.module(appName$2, [
  'ngResource'
]);

module$2.constant('ANALYTICS_API', '/api');

console.log(ANALYTICS_API);


module$2
  .factory('aAuthModel', aAuthModel)
  .factory('aPageModel', aPageModel)
  .factory('aSiteModel', aSiteModel)
  .factory('aVisitModel', aVisitModel)
  .factory('aExperimentModel', aExperimentModel)
  .factory('aExperimentUrlModel', aExperimentUrlModel)
;

function adDashboardCtrl ($scope, aSiteModel) {

  // get sites list
  aSiteModel.find({}, function(res) {
    $scope.sites = res;
    
    $scope.hasUnknown = _.filter(res, {isUnknown: true}).length > 0;
  });
}

function adEditProjectModelCtrl($scope, item) {

    $scope.item = item;

    $scope.saveItem = function(item) {
      var savedItem = angular.copy(item);
      if(!savedItem['siteUrl']) return;

      savedItem['id'] = savedItem['siteUrl'];

      let saveFunc = _.pluck(savedItem, '_id') ? savedItem.$save : savedItem.$create;

      $scope.loading = true;
      return saveFunc.call(item, res => {
        $scope.$close();
      }, () => {
        $scope.loading = false;
        $scope.tableParams.reload();
      });
    };

  }

var appName$3 = 'module.analytics.dashboard';

let module$3 = angular.module(appName$3, [
]);

module$3
  .controller('adDashboardCtrl', adDashboardCtrl)
  .controller('adEditProjectModelCtrl', adEditProjectModelCtrl)
;

// config
module$3.config(function($stateProvider) {

});

function apProjectViewCtrl($scope, item, ngAnalyticsService, aSiteModel, $http, NgTableParams) {
    console.log(item);
    if(!item.analytics) return;

    item.token = {profile_id: item.analytics.profileId};
    item.id = item._id;
    angular.extend($scope, {
      item: item,
      current: {
        site: item.siteUrl,
        date: {
          startDate: moment().subtract(6, 'day'),
          endDate: moment()
        }
      },
      query: {
        ids: 'ga:'+item.analytics.profileId,  // put your viewID here
        metrics: 'ga:pageviews',
        dimensions: 'ga:source, ga:date'
      },
      getAuth: function() {
        if (!item.tokens) return console.error('No tokens provided!');

        $scope.$watch(() => ngAnalyticsService.isReady, isReady => {
          if(isReady) {
            ngAnalyticsService.setToken(item.tokens.access_token);
            ngAnalyticsService.authorize();

            this.getYandexUpdates();
          }
        });
      },
      getYandexUpdates: function() {
        aSiteModel.yandexUpdates(function(resp) {
          if(!resp || resp.status != 200) {
            console.error("Error on response");
            return;
          }

          $scope.item.yandexUpdates = JSON.parse(resp.body);
        });
      },
      getPages: function() {


        this.tableParams = new NgTableParams({}, {
          getData: function(params) {

            return $http({method: 'GET', url: "http://" + item.siteUrl + "/api/posts?page=1&perPage=100&fields=category,alias,title"})
              .then(function (resp) {
                $scope.pages = resp.data;
                console.log($scope.pages);

                params.total(1 * params.count());
                console.log(params);
                return $scope.pages;
              });
          }
      });
      }
    });

    $scope.getAuth();

    $scope.pages = $scope.getPages();
  }

function apPagesViewCtrl($scope, item, project, ngAnalyticsService, aSiteModel, $http, NgTableParams) {
  /* tmp */
  item = item.data[0];

  item.url = [item.category.parentAlias, item.category.alias, item.alias].join("/");
  /* tmp */

  project.token = {profile_id: project.analytics.profileId};
  project.id = project._id;

  $scope.item = item;
  $scope.project = project;


  angular.extend($scope, {
      item: $scope.item,
      current: {
        site: $scope.item.url,
        date: {
          startDate: moment().subtract(6, 'day'),
          endDate: moment()
        }
      },
      query: {
        ids: 'ga:' + $scope.project.analytics.profileId,
        metrics: 'ga:pageviews',
        dimensions: 'ga:source, ga:date',
        filters: 'ga:pagePath=@' + $scope.item.url
      }
    }
  );
}

var appName$4 = 'module.analytics.projects';

let module$4 = angular.module(appName$4, [
]);

module$4
  .controller('apProjectViewCtrl', apProjectViewCtrl)
  .controller('apPagesViewCtrl', apPagesViewCtrl)
;

// config
module$4.config(function($stateProvider) {

});

function asSettingsCtrl($scope, $http, $timeout, ngAnalyticsService, SatellizerPopup, $auth, aSiteModel, aAuthModel) {

    $scope.authenticate = function (provider) {
      $auth.authenticate(provider).then(data => {
        console.info(data)
      }).catch(function (res) {
        console.info(res.data)
      });
    };

    $scope.user = {};


    $scope.signIn = () => {
      aAuthModel.signIn();
    };

    $scope.updateSite = (site) => {
      aSiteModel.updateSite({ _id: site._id }, site, res => {

      });
    };

    $scope.scanSite = (site) => {
      aSiteModel.scanSite({ _id: site._id }, res => {

      });
    };

    $scope.getPages = (site) => {

      $scope.selectedSite = null;
      aSiteModel.get({ _id: site._id }, res => {
        ngAnalyticsService.serviceAuthToken = res.tokens.access_token;
        ngAnalyticsService.authorize();

        $scope.charts = [{
          reportType: 'ga',
          query: {
            metrics: 'ga:sessions',
            dimensions: 'ga:date',
            'start-date': '30daysAgo',
            'end-date': 'yesterday',
            ids: 'ga:' + site.analytics.profileId
          },
          chart: {
            container: 'chart-container-1',
            type: 'LINE',
            options: {
              width: '100%'
            }
          }
        }, {
          reportType: 'ga',
          query: {
            metrics: 'ga:sessions',
            dimensions: 'ga:browser',
            'start-date': '30daysAgo',
            'end-date': 'yesterday',
            ids: 'ga:' + site.analytics.profileId
          },
          chart: {
            container: 'chart-container-2',
            type: 'PIE',
            options: {
              width: '100%',
              is3D: true,
              title: 'Browser Usage'
            }
          }
        }];
        $scope.extraChart = {
          reportType: 'ga',
          query: {
            metrics: 'ga:sessions',
            dimensions: 'ga:date',
            'start-date': '30daysAgo',
            'end-date': 'yesterday',
            ids: 'ga:' + site.analytics.profileId
          },
          chart: {
            container: 'chart-container-3',
            type: 'LINE',
            options: {
              width: '100%'
            }
          }
        };
        $scope.defaultIds = {
          ids: 'ga:' + site.analytics.profileId
        };
        $scope.queries = [{
          query: {
            ids: 'ga:' + site.analytics.profileId,
            metrics: 'ga:sessions',
            dimensions: 'ga:city'
          }
        }];

        $timeout(function () {
          $scope.selectedSite = site;
        }, 1);

      });

      $http.get('http://analytics.5stars.link/api/pages?site._id=' + site._id).then((res) => {
        $scope.pages = res.data;
      });
    };

    $scope.getQueries = (page) => {
      var keywords = {};
      $http.get('http://analytics.5stars.link/api/statistics?page._id=' + page._id + '&sort=clicks').then((res) => {

        _.each(res.data, (item) => {
          keywords[item.query.keyword] = keywords[item.query.keyword] || {};
          keywords[item.query.keyword][item.date] = item.position;
        });
        $scope.queries = keywords;
        console.info(keywords)
      });
    };

    $scope.$on('$gaReportSuccess', function (e, report, element) {
      console.log(report, element);
    });

  }

function asMainMenuCtrl ($scope, aSiteModel) {

  $scope.current = {
    site: null,
    date: {
      startDate: moment().subtract(6, 'day'),
      endDate: moment()
    }
  };

  var sites = [
    {siteUrl: 'http://v-androide.com/'},
    {siteUrl: 'http://vseowode.ru/'}
  ];
  
  var loadSites = () => {
    $scope.hasUnknown = false;
    aSiteModel.find(_.pluck(sites, 'siteUrl'), res => {
      $scope.sites = res;

      $scope.hasUnknown = _.filter(res, {isUnknown: true}).length > 0;
    });
  };
  loadSites();

}

var appName$5 = 'module.analytics.settings';

let module$5 = angular.module(appName$5, [
]);

module$5
  .controller('asMainMenuCtrl', asMainMenuCtrl)
  .controller('asSettingsCtrl', asSettingsCtrl)
;

// config
module$5.config(function($stateProvider) {

});

function asStatisticCtrl($scope, aVisitModel, aSiteModel, ngAnalyticsService, $timeout) {

    $scope.current = {
      site: null,
      date: {
        startDate: moment().subtract(6, 'day'),
        endDate: moment()
      }
    };

    
    var sites = [
      {siteUrl: 'http://v-androide.com/'},
      {siteUrl: 'http://vseowode.ru/'}
    ];

    var loadSites = () => {
      $scope.hasUnknown = false;
      aSiteModel.find(_.pluck(sites, 'siteUrl'), res => {
        $scope.sites = res;

        $scope.hasUnknown = _.filter(res, { isUnknown: true }).length > 0;
      });
    };
    loadSites();


    var updateCharts = () => {
      $scope.isReady = false;
      if (!$scope.current.site) {
        return;
      }

      var start = $scope.current.date.startDate.format('YYYY-MM-DD'),
        end = $scope.current.date.endDate.format('YYYY-MM-DD');

      aVisitModel.getGrownUp({ date_from: start, date_to: end, 'site._id': $scope.current.site._id }, data => {
        $scope.grownUp = data;
      });
      aVisitModel.getDropIn({ date_from: start, date_to: end, 'site._id': $scope.current.site._id }, data => {
        $scope.dropIn = data;
      });

      var profileId = 'ga:' + $scope.current.site.analytics.profileId;
      $scope.profileId = profileId;

      $scope.defaultIds = {
        ids: profileId
      };

      $scope.extraChart = {
        reportType: 'ga',
        query: {
          metrics: 'ga:sessions,ga:users',
          dimensions: 'ga:date',
          'start-date': $scope.current.date.startDate.format('YYYY-MM-DD'),
          'end-date': $scope.current.date.endDate.format('YYYY-MM-DD'),
          ids: profileId
        },
        chart: {
          container: 'chart-container-3',
          type: 'LINE',
          options: {
            width: '100%'
          }
        }
      };

      $timeout(function() {
        $scope.isReady = true;
      }, 10);
    };

    $scope.$watch('current.site._id', siteId => {
      if (!siteId) {
        return;
      }
      var tokens = $scope.current.site.tokens;
      if (tokens.access_token) {
        ngAnalyticsService.serviceAuthToken = tokens.access_token;
        ngAnalyticsService.authorize();
      }

      updateCharts();
    });

    $scope.$watch(() => $scope.current.site && ngAnalyticsService.isReady, isReady => {
      $scope.isReady = isReady;
    });

    $scope.$watch('current.date', date => {
      updateCharts();
    }, true);

  }

function asStatisticPageCtrl($scope, page, $timeout) {


    console.info(page);

    var updateCharts = () => {
      $scope.isReady = false;
      if (!$scope.current.site) {
        return;
      }

      $scope.extraChart = {
        reportType: 'ga',
        query: {
          metrics: 'ga:sessions,ga:users',
          dimensions: 'ga:date',
          'start-date': $scope.current.date.startDate.format('YYYY-MM-DD'),
          'end-date': $scope.current.date.endDate.format('YYYY-MM-DD'),
          ids: $scope.profileId,
          filters: 'ga:pagePath==' + page.url
        },
        chart: {
          container: 'chart-container-3',
          type: 'LINE',
          options: {
            width: '100%'
          }
        }
      };
      $timeout(function() {
        $scope.isReady = true;
      }, 10);
    };

    $scope.$watch('current.date', date => {
      updateCharts();
    }, true);

  }

var appName$6 = 'module.analytics.statistic';

let module$6 = angular.module(appName$6, [
]);

module$6
  .controller('asStatisticCtrl', asStatisticCtrl)
  .controller('asStatisticPageCtrl', asStatisticPageCtrl)
;

// config
module$6.config(function($stateProvider) {

});

function aeExperimentsListCtrl($scope, aExperimentModel) {

    var loadExperiments = () => {
      aExperimentModel.query({ page: 1, perPage: 100 }, res => {
        $scope.experiments = res;
      });
    };
    loadExperiments();

  }

function aeExperimentCtrl($scope, item, aExperimentUrlModel) {

    $scope.item = item;

    aExperimentUrlModel.query({ page: 1, perPage: 100 }, data => {
      $scope.urls = data;
    });

    $scope.saveItem = (item) => {
      var savedItem = angular.copy(item);

      let saveFunc = savedItem._id ? savedItem.$save : savedItem.$create;

      $scope.loading = true;
      return saveFunc.call(item, res => {
        $scope.$close();
      }, () => {
        $scope.loading = false;
      });
    };

  }

function aeEditExperimentModelCtrl($scope, item) {

    $scope.trackingParameters = {
      query: 'Запрос',
      frequence: 'Частотность',
      yandexPosition: 'Позиция в Яндексе',
      googlePosition: 'Позиция в Google',
      yandexTraffic: 'Трафик по Яндекс',
      googleTraffic: 'Трафик по Google',
      traffic: 'Общий трафик'
    };
    $scope.trackingParametersKeys = _.keys($scope.trackingParameters);

    $scope.item = item;

    $scope.saveItem = (item) => {
      var savedItem = angular.copy(item);

      let saveFunc = savedItem._id ? savedItem.$save : savedItem.$create;

      $scope.loading = true;
      return saveFunc.call(item, res => {
        $scope.$close();
      }, () => {
        $scope.loading = false;
      });
    };

  }

function aeEditExperimentUrlCtrl($scope, item, experiment, aSiteModel) {

    $scope.experiment = experiment;
    $scope.item = item;
console.info(experiment)
    aSiteModel.query({ page:1, perPage: 100 }, data => {
      $scope.projects = data;
    });

    $scope.saveItem = (item) => {
      var savedItem = angular.copy(item);

      let saveFunc = savedItem._id ? savedItem.$save : savedItem.$create;

      $scope.loading = true;
      return saveFunc.call(item, res => {
        $scope.$close();
      }, () => {
        $scope.loading = false;
      });
    };

  }

var appName$7 = 'module.analytics.experiments';

let module$7 = angular.module(appName$7, [
]);

module$7
  .controller('aeExperimentsListCtrl', aeExperimentsListCtrl)
  .controller('aeExperimentCtrl', aeExperimentCtrl)
  .controller('aeEditExperimentModelCtrl', aeEditExperimentModelCtrl)
  .controller('aeEditExperimentUrlCtrl', aeEditExperimentUrlCtrl)
;

// config
module$7.config(function($stateProvider) {

});

function analyticsGaReport ($parse, $modal, toaster, $timeout, NgTableParams, $filter, $q) {
  var number = 0;
  Chart.defaults.global.responsive = true;
  return {
    restrict: 'A',
    scope: {
      'report': '=analyticsGaReport',
      'date': '=',
      'site': '='
    },
    templateUrl: '/app/views/analytics/directives/analytics-report.html',
    link: function (scope, element, attrs) {
      scope.reportData = {};

      scope.table = {};
      scope.chart = {
        options: {
          responsive: true,
          maintainAspectRatio: true
        }
      };
      scope.chartLines = {};

      scope.current = {
        queries: [],
        chart: null,
        columns: []
      };

      scope.tableParams = new NgTableParams({
        page: 1,
        count: 100,
        sorting: {

        }
      }, {
        filterDelay: 0,
        getData: ($defer, params) => {
          if(params.orderBy()){
            scope.table.data = params.sorting() ?
              $filter('orderBy')(scope.table.data, params.orderBy()) :
              scope.table.data;

            params.total(scope.table.data.length);
            $defer.resolve(scope.table.data);
          }
          else{
            params.total(scope.table.total);
            $defer.resolve(scope.table.data);
          }

        }
      });


      function makeCanvas(container) {
        var canvas = document.createElement('canvas');
        var ctx = canvas.getContext('2d');

        container.html('');
        canvas.width = container.width();
        canvas.height = container.height();
        container.append(canvas);

        return ctx;
      }

      var showReport = () => {
        var report = scope.report;
        if (!report || !profileId) {
          return;
        }

        scope.table = {
          headers: [],
          rows: [],
          data: []
        };

        scope.current.columns = (report.dimensions.split(',') || []).concat(report.metrics.split(',') || []);
        $timeout(() => {
          scope.current.chart = {
            reportType: 'ga',
            query: {
              metrics: report.metrics,
              dimensions: report.dimensions,
              'start-date': scope.date.startDate.format('YYYY-MM-DD'),
              'end-date': scope.date.endDate.format('YYYY-MM-DD'),
              ids: 'ga:' + profileId,
              'filters': report.filters,
              // 'max-results': maxResults,
              // 'sampling-level': samplingLevel,
              // 'segments': segment
            },
            chart: {
              container: 'chart-container-' + (number++),
              type: 'LINE',
              options: {
                'width': '100%'
              }
            }
          };
          scope.current.queries = [{
            query: {
              metrics: report.metrics,
              dimensions: report.dimensions,
              'start-date': scope.date.startDate.format('YYYY-MM-DD'),
              'end-date': scope.date.endDate.format('YYYY-MM-DD'),
              ids: 'ga:' + profileId,
              'filters': report.filters,
              // 'max-results': maxResults,
              // 'sampling-level': samplingLevel,
              // 'segments': segment
            }
          }];
        }, 100);
        scope.number = number;
        scope.loading = true;
      };

      var profileId;
      scope.$watchGroup(['site.id', 'date.startDate'], () => {
        profileId = scope.site.token.profile_id;

        scope.current.queries = [];
        scope.current.chart = null;
        showReport();
      }, true);


      var chart;
      scope.$on('$gaReportSuccess', function (event, report, element) {
        if (!report) {
          return;
        }


        _.each(report, function (data) {
          var rows = _.map(data.rows, row => {
              return _.map(row, (item, n) => {
                var column = scope.current.columns[n];

                switch (column.replace(/\s{1,}/g, "")) {
                  case 'ga:date':
                    return moment(item, 'YYYYMMDD').format('DD/MM/YYYY');
                  default:
                    return jQuery.isNumeric(item) ? Math.round(item * 100) / 100 : item;
                }
              });
            }),
            headers = _.map(data.columnHeaders, header => {
              var itemName = header.name, item = {id:header.name};

              item.title = itemName;
              item.titleAlt = itemName;
              item.name = itemName.replace(':', '');
              item.sortable = itemName;
              item.show = true;
              item.field = itemName;

              return item;
            });

          var rows = _.reduce(rows, grouper);
          scope.headers = headers;
          scope.table = {
            headers: headers,
            rows: rows,
            total: _.map(data.totalsForAllResults, (value, key) => {
              var column = {id:key};
              column.value = value;
              return column;
            }),
            data: _.map(rows, row => {
              return _.mapKeys(row, (header_v, header_k) => {
                return headers[header_k].name;
              });
            })
          };


          scope.$watch("site.yandexUpdates", function(yandexData) {
            rows.push(["Yandex Update", moment(yandexData.data.index.upd_date, 'YYYYMMDD').format('DD/MM/YYYY'), 1]);
          });


          scope.tableParams.reload();

          var dimensions = scope.report.dimensions.split(',') || [],
            metrics = scope.report.metrics.split(',') || [];

          scope.chart.labels = _.map(rows, row => row[0]);
          scope.chart.series = _.pluck(metrics, 'uiName');
          scope.chart.data = _.map(metrics, (metric, n) => {
            return _.map(rows, row => parseInt(row[1 + n]))
          });

          scope.initialChartData = angular.copy(scope.chart);

          if (dimensions.length == 2) {
            var flat = _.reduce(angular.copy(rows), sumer);

            rows = rows.concat(flat);

            var groups = _.groupBy(rows, item => item[0]);
            var dates = _.groupBy(rows, item => item[1]),
              n = 0;

            scope.chart.labels = _.keys(dates);
            scope.chart.series = _.keys(groups);
            scope.chart.data = _.map(groups, (group, key) => {
              return _.map(group, row => parseInt(row[2]));
            });


            scope.dataChart = angular.copy(scope.chart.data);
            scope.seriesChart = angular.copy(scope.chart.series);

            scope.seriesChart.forEach(series => {
              scope.chartLines[series] = {
                name: series,
                $enabled: true
              };
            });
          }
          scope.hideChart = dimensions.length > 2;
        });
        scope.loading = false;
      }, true);


      // helpers
      var insert, resultsFolded = [], tmpData = {}, folders = ["google", "yandex", "Yandex Update"], arrLen;
      function grouper(result, value, key, lastArr) {
        arrLen = arrLen || lastArr.length;

        if(~folders.indexOf(result[0])) {
          resultsFolded.push(result);
        } else {
          tmpData = returnTempValue(tmpData, result, "Other traffic");
        }

        if(arrLen === key+1) {
          for(insert in tmpData) {
            resultsFolded.push(tmpData[insert]);
          }
          return resultsFolded;
        }

        return value;
      }

      var tempSummer = {}, tmpLen, allResIns, reurnedRes = [];
      function sumer(resultS, valueS, indexS, allResults) {
        tmpLen = tmpLen || allResults.length;
        tempSummer = returnTempValue(tempSummer, resultS, "All traffic");
        if(tmpLen === indexS+1) {
          for(allResIns in tempSummer) {
            reurnedRes.push(tempSummer[allResIns]);
          }
          return reurnedRes;
        }
        return valueS;
      }

      function returnTempValue(tmpScope, resultAggr, firstIndexName) {
        if(tmpScope[resultAggr[1]] != undefined) {
          tmpScope[resultAggr[1]][2] += resultAggr[2];
        } else {
          resultAggr[0] = firstIndexName;
          tmpScope[resultAggr[1]] = resultAggr;
        }
        return tmpScope;
      }

      scope.rechart = function(chartLines) {
        var checked = _.filter(chartLines, selection => { return selection.$enabled; }).map(checked => { return checked.name; });
        var intersect = [];


        scope.seriesChart.forEach((item, index) => {
          if(~checked.indexOf(item)) intersect.push(index);
        });

        scope.chart.data = scope.dataChart.filter(returnIntersection);
        scope.chart.series = scope.seriesChart.filter(returnIntersection);

        function returnIntersection(item, index) { return ~intersect.indexOf(index); }
      }

      /*scope.$on('$gaReportSuccess', function (e, report, element) {
       console.info(report)
       });*/
      scope.$on('$gaReportError', function (e, report, element) {
        console.log(report.error);
        scope.report.$error = report.error;
        toaster.pop('error', report.error.message);
      });
    }
  };
}

var appName$8 = "module.analytics.directives";

let module$8 = angular.module(appName$8, []);

module$8.directive('analyticsGaReport', analyticsGaReport);

function routes($stateProvider, $urlRouterProvider) {

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
        item: function(aSiteModel, $stateParams) { return aSiteModel.get({ _id: $stateParams.projectId })}
      }
    })
    .state('analytics.project.info', {
      url: '/info',
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

    .state('pages', {
      parent: 'analytics',
      url: '/project/:projectId/page/:pageId',
      views: {
        'main-content': {controller: 'apPagesViewCtrl', templateUrl: 'app/views/analytics/projects/page-statistic.html'}
      },
      resolve: {
        //item: function(aSiteModel, $stateParams) { return aSiteModel.get({ _id: $stateParams.projectId })}
        item: function($http, $stateParams) { return $http.get("http://v-androide.com/api/posts?page=1&perPage=1&_id="+$stateParams.pageId, { perPage: 1, _id: $stateParams.pageId, fields: ['category','alias','title'] })},
        project: function(aSiteModel, $stateParams) { return aSiteModel.get({ _id: $stateParams.projectId })}
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

var appName$1 = 'module.analytics';

var module$1 = angular.module(appName$1, [
  'chart.js',
  appName$2,
  appName$3,
  appName$4,
  appName$5,
  appName$7,
  appName$6,
  appName$8
]);

module$1
  .config(routes)
;

var modules = [
  appName$1
];

class MainServiceCtrl {
    constructor($scope) {
        console.log($scope);
    }
}

function routesConfig($stateProvider, $urlRouterProvider) {

    // $urlRouterProvider.otherwise(function($inject) {
    //     var $state = $inject.get('$state');
    //     $state.go('homepage');
    // });

    $stateProvider
    //Main page
        .state('homepage', {
            url:"/",
            views: {
                'main-content':{
                    controller: "MainServiceCtrl",
                    templateUrl: "app/views/home.html"
                }
            }
        })
      .state('private', { // complete
        abstract: true,
        views: {
          'dashboard': {templateUrl: 'app/views/master-dashboard.html'}
        }
      })
    ;

    $stateProvider.state("home", {
      url: "/"
    });
};

let appName$9 = 'base';

var module$9 = angular.module(appName$9,
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

module$9.controller('MainServiceCtrl', MainServiceCtrl);

module$9.config(routesConfig);

let appName = 'gaanalytics';

try {
  angular.module('views');
} catch (e) {
  angular.module('views', []);
}

window.config = config;

angular.module(appName, [appName$9, 'views', 'ngTable'].concat(modules));

angular.element(document).ready(function() {
    angular.bootstrap(document, [appName]);
});