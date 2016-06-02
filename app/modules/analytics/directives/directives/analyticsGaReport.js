import chartCustomTooltip from '../../../../../app/libs/chart-custom-tooltip';

export default
/*@ngInject*/
function ($parse, $modal, toaster, $timeout, NgTableParams, $filter) {
  var number = 0;
  Chart.defaults.global.responsive = true;
  Chart.defaults.global.customTooltips = chartCustomTooltip;

  Chart.types.Line.extend({
    name: "yandex",
    draw: function () {
      //Chart.types.Line.prototype.draw.apply(this, arguments);
      if(!this.options.lineAtIndex || !(this.options.lineAtIndex instanceof Array)) return;
        this.options.lineAtIndex.forEach(line => {
          var pointIndex = _.findIndex(this.datasets[0].points, {label: line});
          if(pointIndex === -1) return;
          var  point = this.datasets[0].points[pointIndex],
            scale = this.scale;
          // draw line
          this.chart.ctx.beginPath();
          this.chart.ctx.moveTo(point.x, scale.startPoint + 24);
          this.chart.ctx.strokeStyle = '#ff0000';
          this.chart.ctx.lineTo(point.x, scale.endPoint);
          this.chart.ctx.stroke();

          // write TODAY
          this.chart.ctx.textAlign = 'center';
          this.chart.ctx.font="12px Helvetica Neue";
          this.chart.ctx.fillStyle = "rgba(70,191,189,1)";
          this.chart.ctx.fillText("YANDEX UPD.", point.x, scale.startPoint + 12);
        });
    }
  });

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
      'site': '=',
      'dateService': '='
    },
    templateUrl: '/app/views/analytics/directives/analytics-report.html',
    link: function (scope, element, attrs) {
      scope.reportData = {};
      scope.mainFolders = ["google", "yandex", "Yandex Update"];

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
      scope.queries = [];
      scope.chartOptions = {};


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

      scope.$watch(() => scope.dateService, dateServiceChange => {
        console.log('dateServiceChange', dateServiceChange);
        scope.date.startDate = dateServiceChange.start;
        scope.date.endDate = dateServiceChange.end;

        if (!scope.site) {
          return;
        }
        profileId = scope.site.token.profile_id;
        scope.current.queries = [];
        scope.current.chart = null;
        scope.chartLines = {};
        scope.checkedBoxes = [];

        showReport();
      }, true);

      scope.seriesColours = {};

      var showReport = () => {
        var report = angular.copy(scope.report);
        if (!report || !profileId) {
          return;
        }

        scope.table = {
          headers: [],
          rows: [],
          data: []
        };

        scope.current.columns = (report.dimensions.split(',') || []).concat(report.metrics.split(',') || []);

        var chartOptions = report.chart || {'width': '100%'};

        $timeout(() => {
          console.log('Chart.defaults.Line', Chart.defaults.Line);
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

          scope.queries = angular.copy(scope.current.queries);

        }, 100);

        scope.number = number;
        scope.loading = true;
      };

      var profileId;
      // scope.$watchGroup(['date.startDate', 'date.endDate'], () => {
      //   if (!scope.site) {
      //     return;
      //   }
      //
      //   profileId = scope.site.token.profile_id;
      //   scope.current.queries = [];
      //   scope.current.chart = null;
      //   //
      //   showReport();
      // }, true);

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
              insert, resultsFolded = [], tmpData = {}, folders = scope.mainFolders;
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
              var updateDates = yUpdate.map(date => {
                return moment(date.date, moment.ISO_8601).format('DD/MM/YYYY');
              });
              drawUpdates(updateDates, rows);
            });

            scope.$watch("site.keywords", function (keywords) {
              if(!keywords) return;

              var dates = summa.map(summItem => {return summItem[1]}),
              dateFound, keywordsGroupTmp = _.groupBy(keywords, item => item[0]),
                keywordsGrouped = [], keywordsIndexes = Object.keys(keywordsGroupTmp),
                keywordsGroup = {};

              if(scope.report.intersections && keywordsIndexes.length > 1) {
                var intersection = scope.report.intersections;
                keywordsIndexes.sort(keyword => {
                  return ~intersection.indexOf(keyword) ? -1 : 1;
                });

                keywordsIndexes.slice(0,10).forEach(keyword => {
                  keywordsGroup[keyword] = keywordsGroupTmp[keyword];
                });
              } else {
                keywordsGroup = keywordsGroupTmp;
              }

              _.forEach(keywordsGroup, (groupItem, keyword) => {
                var collectionByDates = [];
                dates.forEach(date => {
                  dateFound = _.find(groupItem, {1: date}) || [keyword, date, 0];
                  collectionByDates.push(dateFound);
                });

                keywordsGrouped = keywordsGrouped.concat(collectionByDates);
              });

              rows = rows.concat(keywordsGrouped);
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
        scope.chartOptions = chart.options;
        resetSeries(chart);
      });

      function drawUpdates(yandexRows, rows) {
        var ctx = document.querySelector(".chart").getContext("2d");

        scope.chart.datasets = scope.chart.data.map((dataset, index) => {return {data: dataset, label: scope.chart.series[index]}});


        //groupByRows(rows);
        var yandexOverlapChart = angular.copy(scope.chart);
        if(scope.yandexChart) scope.yandexChart.destroy();
        scope.$watch("chartOptions", options => {
          if(!Object.keys(options).length) return;


          console.log('scope.yandexChart', scope.yandexChart);
          if(scope.yandexChart) scope.yandexChart.destroy();

          console.log(options);
          yandexOverlapChart.options = options;
          yandexOverlapChart.options.lineAtIndex = yandexRows;
          scope.yandexChart = new Chart(ctx).yandex(yandexOverlapChart, {
            datasetFill : false,
            lineAtIndex: yandexRows,
            scaleFontSize: 12
          });
        });
      }

      function resetSeries(chart) {

        var mainLabels = angular.copy(scope.mainFolders).concat(["Весь трафик", "Другой трафик"]),
          color, _savedColor;

        if(chart !== undefined) {

          if(scope.report.colors && scope.report.intersections) {

            chart.datasets = chart.datasets.map(dataItem => {
              color = dataItem.strokeColor;
              if (~mainLabels.indexOf(dataItem.label)) return dataItem;

              color = scope.report.colors[0];
              if(~scope.report.intersections.indexOf(dataItem.label)) {
                color = scope.report.colors[1];
              }
              dataItem.strokeColor = color;
              dataItem.pointColor = color;
              dataItem.fillColor = color.replace(/(\d{1})+(?=\))/, "0.2");

              dataItem.points = dataItem.points.map(point => {
                _savedColor = color.replace(/(\d{1})+(?=\))/, "0.8");
                point._saved.fillColor = color;
                point._saved.highlightStroke = _savedColor;
                point.fillColor = color;
                point.highlightStroke = _savedColor;

                return point;
              });
              return dataItem;
            });
          }

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
          n = 0, keywordsGrouped = [],
          //mainLabels = angular.copy(scope.mainFolders).concat(["Весь трафик", "Другой трафик"]),
          dateFound, dateIndexes = Object.keys(dates),
          collectionByDates = {};

        if(scope.report.fillDates) {
          _.forEach(groups, (groupItem, keyword) => {
            if(~["Yandex Update"].indexOf(keyword)) {
              collectionByDates[keyword] = groupItem;
              return;
            }
            collectionByDates[keyword] = [];
            dateIndexes.forEach(date => {
              dateFound = _.find(groupItem, {1: date}) || [keyword, date, 0];
              collectionByDates[keyword].push(dateFound);
            });
          });
          groups = collectionByDates;
        }

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
        scope.loading = false;
        scope.report.$error = gaReport.error;
        toaster.pop('error', gaReport.error.message);
      });
    }
  };
}