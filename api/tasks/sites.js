'use strict';

var async = require('async'),
  _ = require('lodash'),
  moment = require('moment');

exports['sites.scanSite'] = function (app, msg, cb) {
  var log = app.log;

  var endDate = moment().subtract(1, 'day'),
    startDate = moment(endDate).subtract(90, 'day');

    async.auto({
    'site': function (next) {
      app.models.sites.findById(msg.body._id, next);
    },
    'token': ['site', function (next, data) {
      app.services.google.setCredentials(data.site.tokens);
      if (data.site.tokens.refresh_token) {
        app.services.google.refreshAccessToken(function (err, tokens) {
          if(err || !tokens) {
            return next(err || 'No tokens from GA refresh!');
          }
          app.services.google.setCredentials(tokens);
          if (tokens.refresh_token) {
            data.site.tokens = tokens;

            log.info('Tokens refreshed: '+JSON.stringify(tokens));
            return data.site.save(next);
          }
          next();
        });
        return;
      }
      next();
    }],
    'reports': ['token', function (next, data) {
      var currentDate = moment(startDate);
      return next();
      app.services.analytics.syncReports(data.site, startDate, endDate, next);
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

exports['sites.scanAll'] = function (app, msg, cb) {
  var log = app.log;

  async.auto({
    sites: function (next) {
      app.models.sites.find({}, next);
    },
    scan: ['sites', (next, data) => {
      if(!data.sites) return next('No data to process.');

      data.sites.forEach(record => {
        app.services.tasks.publish('sites.scanSite', { _id: record._id });
      });
      next();
    }]
  }, cb);

};