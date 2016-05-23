var appName = 'module.analytics.filters';

let module = angular.module(appName, []);

module.filter('find', function() {
  return function (input, selector, value, field) {
    var result;

    switch(selector) {
      case 'date':
        var date = (value === 'now') ? moment() : ((value > 0) ? moment().add(value, 'days') : moment().subtract(Math.abs(value), 'days'));
        result = _.find(input, {date: date.format("YYYY-MM-DD")});
        if(field && result && result[field]) result = result[field];
        break;
    }

    return result || input;
  }
});

module.filter('datestring', function () {
  return function(input, inputFormat, format) {
    return moment(input, inputFormat).format(format || "YYYY-MM-DD");
  }
});

export default appName;