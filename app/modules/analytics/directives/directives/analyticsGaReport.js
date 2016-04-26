export default
/*@ngInject*/
function ($parse, $modal, toaster, $timeout, NgTableParams, $filter, $q) {
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