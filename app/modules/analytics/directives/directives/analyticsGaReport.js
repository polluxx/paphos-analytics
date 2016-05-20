export default
/*@ngInject*/
function ($parse, $modal, toaster, $timeout, NgTableParams, $filter, $q, dateService) {
  var number = 0;
  Chart.defaults.global.responsive = true;
  var defaultLineOptions = {
    datasetStrokeWidth: 2,
    bezierCurve: true,
    datasetFill: true
  };

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

      if(!scope.report) return;

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
      scope.checkedBoxes = [];

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

      scope.date.startDate = dateService.start;
      scope.date.endDate = dateService.end;

      scope.$on('daterange', function(event, dateStart, dateEnd) {
        scope.date.startDate = dateStart;
        scope.date.endDate = dateEnd;
        scope.$apply();
      });

      scope.seriesColours = {};

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

        $timeout(() => {

          if(scope.report.pure !== undefined) {
            Chart.defaults.Line.datasetStrokeWidth = 1.5;
            Chart.defaults.Line.bezierCurve = false;
            Chart.defaults.Line.bezierCurveTension = 0.4;
            Chart.defaults.Line.datasetFill = false;

          } else {
            var defaultLineIndex;
            for(defaultLineIndex in defaultLineOptions) {
              Chart.defaults.Line[defaultLineIndex] = defaultLineOptions[defaultLineIndex];
            }
          }

          scope.current.chart = {
            reportType: 'ga',
            query: {
              metrics: report.metrics,
              dimensions: report.dimensions,
              'start-date': moment(scope.date.startDate).format('YYYY-MM-DD'),
              'end-date': moment(scope.date.endDate).format('YYYY-MM-DD'),
              ids: 'ga:' + profileId,
              'filters': report.filters,
              'max-results': report.maxResults || 1000,
              sort: report.sort || null
              // 'sampling-level': samplingLevel,
              // 'segments': segment
            },
            chart: {
              container: 'chart-container-' + (number++),
              type: 'LINE'
            }
          };

          scope.current.queries = [{
            query: {
              metrics: report.metrics,
              dimensions: report.dimensions,
              'start-date': moment(scope.date.startDate).format('YYYY-MM-DD'),
              'end-date': moment(scope.date.endDate).format('YYYY-MM-DD'),
              ids: 'ga:' + profileId,
              'filters': report.filters,
              'max-results': report.maxResults || 1000,
              sort: report.sort || null
              // 'sampling-level': samplingLevel,
              // 'segments': segment
            }
          }];

        }, 100);

        scope.number = number;
        scope.loading = true;
      };

      var profileId;
      scope.$watchGroup(['site.id', 'date.startDate', 'date.endDate'], () => {
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
                tmpData = returnTempValue(tmpData, row, "Другой трафик");
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
          scope.tableParams.reload();

          var dimensions = scope.report.dimensions.split(',') || [],
            metrics = scope.report.metrics.split(',') || [];

          scope.chart.legend = !!scope.report.legend;
          scope.chart.labels = rows.map(row => row[0]);
          scope.chart.series = _.pluck(metrics, 'uiName');
          scope.chart.data = metrics.map((metric, n) => {
            return rows.map(row => parseInt(row[1 + n]))
          });

          scope.initialChartData = angular.copy(scope.chart);

          if (dimensions.length == 2) {

            if(!scope.report.pure) {
              var rowsCompact = angular.copy(rows),
                allRowsIndex = 0, rowsCompactLength = rowsCompact.length, tempSummer = {}, rowCompact, tmpSummerIndex, summa = [];
              for (allRowsIndex; allRowsIndex < rowsCompactLength; allRowsIndex++) {
                rowCompact = rowsCompact[allRowsIndex];
                tempSummer = returnTempValue(tempSummer, rowCompact, "Весь трафик");
              }
              for (tmpSummerIndex in tempSummer) {
                summa.push(tempSummer[tmpSummerIndex]);
              }
              rows = rows.concat(summa);
            }

            scope.$watch("site.yandexUpdates", function (yUpdate) {
              if(!yUpdate) return;

              var dates = summa.map(summItem => {return summItem[1]}), updateDate = moment(yUpdate.data.index[0].upd_date[0], 'YYYYMMDD').format('DD/MM/YYYY'),
                mostBigCoounter = summa[summa.length-2][2];

              dates.forEach(date => {
                rows.push(["Yandex Update", date, updateDate === date ? Math.ceil(mostBigCoounter / 10) : 0]);
              });

              groupByRows(rows);
            });

            groupByRows(rows);
          }
          scope.hideChart = dimensions.length > 2;
        });
        scope.loading = false;
      }, true);

      // listen to chart create event and get colors
      scope.$on('create', function(e, chart) {
       if(scope.chart != undefined) {
         scope.current.queries = [];
         scope.current.chart = null;
       }
        resetSeries(chart);
      });

      function resetSeries(chart) {
        if(chart !== undefined) {
          chart.datasets.forEach(dataset => {
            scope.seriesColours[dataset.label] = dataset.strokeColor;
          });
        }

        scope.chart.series.forEach(series => {

          scope.chartLines[series] = {
            name: series,
            color: scope.seriesColours[series] || "",
            $enabled: series.$enabled !== undefined ? series.$enabled : true
          };
        });

        if(scope.checkedBoxes.length) {
          scope.seriesChart.forEach((item) => {
            if(!~scope.checkedBoxes.indexOf(item)) scope.chartLines[item].color = "";
          });
        }
      }

      function groupByRows(rows) {
        var groups = _.groupBy(rows, item => item[0]);
        var dates = _.groupBy(rows, item => item[1]),
          n = 0;

        scope.chart.labels = Object.keys(dates).sort((a,b) => {
          var first = moment(a, 'DD/MM/YYYY'), second = moment(b, 'DD/MM/YYYY');
          return (first === second) ? 0 : (first > second ? 1 : -1);
        });
        scope.chart.series = Object.keys(groups);

        scope.chart.data = _.map(groups, (group, key) => {
          return group.map(row => parseInt(row[2]));
        });

        scope.dataChart = angular.copy(scope.chart.data);
        scope.seriesChart = angular.copy(scope.chart.series);
        //resetSeries();
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
        scope.checkedBoxes = _.filter(chartLines, selection => { return selection.$enabled; }).map(checked => { return checked.name; });
        var intersect = [];

        scope.seriesChart.forEach((item, index) => {
          if(~scope.checkedBoxes.indexOf(item)) intersect.push(index);
        });

        scope.chart.data = scope.dataChart.filter(returnIntersection);
        scope.chart.series = scope.seriesChart.filter(returnIntersection);
        function returnIntersection(item, index) { return ~intersect.indexOf(index); }
      };

      scope.$on('$gaReportError', function (e, gaReport, element) {
        scope.report.$error = gaReport.error;
        toaster.pop('error', gaReport.error.message);
      });
    }
  };
}