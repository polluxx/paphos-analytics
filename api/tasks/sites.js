'use strict';

var async = require('async'),
  _ = require('lodash'),
  moment = require('moment');

exports['sites.scanSite'] = function (app, msg, cb) {
  var log = app.log;

  var endDate = moment.max(moment(), moment().endOf('month')),
    startDate = moment(endDate).subtract(1, 'month');

    async.auto({
    'site': function (next) {
      app.models.sites.findById(msg.body._id, next);
    },
    'token': ['site', function (next, data) {
      app.services.google.setCredentials(data.site.tokens);
      if (data.site.tokens.refresh_token) {
        app.services.google.refreshAccessToken(function (err, tokens) {
          app.services.google.setCredentials(tokens);
          if (tokens.refresh_token) {
            data.site.tokens = tokens;
            return data.site.save(next);
          }
          next();
        });
        return
      }
      next();
    }],
    'reports': ['token', function (next, data) {
      var currentDate = moment(startDate);

      app.services.analytics.syncReports(data.site, next);
    }],
    'query': ['token', function (next, data) {
      var currentDate = moment(startDate);
return next();
      async.whilst(function () {
        return !currentDate.isAfter(endDate);
      }, function (next) {
        log.info('syncStatisticForDay(%s)', currentDate.format('YYYY-MM-DD'));
        app.services.webmasters.syncStatisticForDay(data.site, currentDate.format('YYYY-MM-DD'), next);
        currentDate.add(1, 'day');
      }, next);
    }]
  }, cb);
};