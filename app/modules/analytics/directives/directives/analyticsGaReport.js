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

      scope.tabletype = 'all';
      if(scope.report.type !== undefined) scope.tabletype = scope.report.type;

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

      scope.date.startDate = moment(scope.date.startDate).format('YYYY-MM-DD');
      scope.date.endDate = moment(scope.date.endDate).format('YYYY-MM-DD');

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

        var chartOptions = scope.report.chart || {'width': '100%'};
        console.log(chartOptions);
        $timeout(() => {
          scope.current.chart = {
            reportType: 'ga',
            query: {
              metrics: report.metrics,
              dimensions: report.dimensions,
              'start-date': scope.date.startDate,
              'end-date': scope.date.endDate,
              ids: 'ga:' + profileId,
              'filters': report.filters,
              // 'max-results': maxResults,
              // 'sampling-level': samplingLevel,
              // 'segments': segment
            },
            chart: {
              container: 'chart-container-' + (number++),
              type: 'LINE',
              options: chartOptions
            }
          };
          scope.current.queries = [{
            query: {
              metrics: report.metrics,
              dimensions: report.dimensions,
              'start-date': scope.date.startDate,
              'end-date': scope.date.endDate,
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
        if (!scope.site) {
          return;
        }
        profileId = scope.site.token.profile_id;

        scope.current.queries = [];
        scope.current.chart = null;
        showReport();
      }, true);


      var chart, rows = [], headers = [];
      scope.$on('$gaReportSuccess', function (event, gaReport, element) {
        if (!gaReport) {
          return;
        }

        _.each(gaReport, function (data) {
          rows = _.map(data.rows, row => {
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
              var itemName = header.name.replace('ga:', ''), item = {id:header.name};

              item.title = itemName;
              item.titleAlt = itemName;
              item.name = itemName;
              item.sortable = itemName;
              item.show = true;
              item.field = itemName;

              return item;
            });

          if(!scope.report.pure) {
            var indRows = 0, rowsLen = rows.length, row,
              insert, resultsFolded = [], tmpData = {}, folders = ["google", "yandex", "Yandex Update"];
            for (indRows; indRows < rowsLen; indRows++) {
              row = rows[indRows];
              if (~folders.indexOf(row[0])) {
                resultsFolded.push(row);
              } else {
                tmpData = returnTempValue(tmpData, row, "Other traffic");
              }
            }
            for (insert in tmpData) {
              resultsFolded.push(tmpData[insert]);
            }
            rows = resultsFolded;
          }

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

          /*scope.$watch("site.yandexUpdates", function(yandexData) {
            rows.push(["Yandex Update", moment(yandexData.data.index.upd_date, 'YYYYMMDD').format('DD/MM/YYYY'), 1]);
          });*/

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

            if(!scope.report.pure) {
              var rowsCompact = angular.copy(rows),
                allRowsIndex = 0, rowsCompactLength = rowsCompact.length, tempSummer = {}, rowCompact, tmpSummerIndex, summa = [];
              for (allRowsIndex; allRowsIndex < rowsCompactLength; allRowsIndex++) {
                rowCompact = rowsCompact[allRowsIndex];
                tempSummer = returnTempValue(tempSummer, rowCompact, "All traffic");
              }
              for (tmpSummerIndex in tempSummer) {
                summa.push(tempSummer[tmpSummerIndex]);
              }
              rows = rows.concat(summa);
            }

            if(scope.site.yandexUpdates !== undefined) {
              var dates = summa.map(summItem => {return summItem[1]}), updateDate = moment(scope.site.yandexUpdates.data.index.upd_date, 'YYYYMMDD').format('DD/MM/YYYY'),
                mostBigCoounter = summa[summa.length-2][2];

              dates.forEach(date => {
                rows.push(["Yandex Update", date, updateDate === date ? Math.ceil(mostBigCoounter / 10) : 0]);
              });

            }

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
      scope.$on('$gaReportError', function (e, gaReport, element) {
        console.log(gaReport.error);
        scope.report.$error = gaReport.error;
        toaster.pop('error', gaReport.error.message);
      });
      
      // datepicker
      scope.flag = false;
      scope.fromDate = new Date();
      scope.toDate = new Date();

      scope.popupTo = {
        opened: false
      };

      scope.popupFrom = {
        opened: false
      };

      scope.openFrom = function() {
        scope.popupFrom.opened = true;
      };

      scope.openTo = function() {
        scope.popupTo.opened = true;
      };

      scope.disabled = function(date, mode) {
        return (date.getMonth() == scope.fromDate.getMonth()) ? (mode === 'day' && (date.getDate() < scope.fromDate.getDate())) : (date.getMonth() < scope.fromDate.getMonth()) ? mode === 'day' : false;
      };

      scope.inlineOptions = {
        showWeeks: false
      };

      scope.dateOptions = {
        formatYear: 'yy',
        showWeeks: false,
        maxDate: new Date(2020, 5, 22),
        minDate: new Date(),
        startingDay: 1
      };

      scope.toggleMin = function() {
        scope.inlineOptions.minDate = scope.inlineOptions.minDate ? null : new Date();
        scope.dateOptions.minDate = scope.inlineOptions.minDate;
      };
      scope.toggleMin();

      scope.refreshData = function () {
        scope.date.startDate = moment(scope.fromDate).format('YYYY-MM-DD');
        scope.date.endDate = moment(scope.toDate).format('YYYY-MM-DD');
      }
    }
  };
}