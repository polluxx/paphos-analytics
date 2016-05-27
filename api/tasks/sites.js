'use strict';

var async = require('async'),
  _ = require('lodash'),
  moment = require('moment');

exports['sites.scanSites'] = function (app, msg, cb) {
  var log = app.log;

  var startDate = moment().subtract(2, 'day'),
    endDate = moment();

    async.auto({
    'sites': function (next) {
      app.models.sites.find({}, next);
    },
    'tokens': ['sites', function (next, data) {
      if(!data.sites) return next();

      data.sites.forEach(site => {
        setToken(app, site, next);
      });
    }],
    'reports': ['tokens', 'sites', function (next, data) {
      return next();
      data.sites.forEach(site => {
        app.services.analytics.syncReportsForSite(site, startDate, endDate, next);
      });
    }],

    'query': ['tokens', function (next, data) {
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

  exports['sites.analyticsSync'] = function (app, msg, cb) {
  var log = app.log;

  var startDate = moment().subtract(2, 'day'),
    endDate = moment();

  async.auto({
    'sites': function (next) {
      app.models.sites.find({}, next);
    },
    'tokens': ['sites', function (next, data) {
      if(!data.sites) return next();
      data.sites.forEach(site => {
        setToken(app, site, next);
      });
    }],
    'reports': ['sites', 'tokens', function (next, data) {
      data.sites.forEach(site => {
        app.services.analytics.syncReportsForSite(site, startDate, endDate, next);
      });
    }]
  }, cb);
};

exports['sites.garbageClean'] = function(app, msg, cb) {
  async.auto({
    tmpSites: function (next) {
      app.models.tempSites.find({}, next);
    },
    clear: ['tmpSites', (next, data) => {
      if(data.tmpSites.length) return next();

      data.tmpSites.forEach(site => {
        app.models.tempSites.remove({_id: site._id}, next);
      });
    }]
  }, cb);
};

exports['sites.yandexUpdates'] = function (app, msg, next) {
  app.services.analytics.getYandexUpdates(function (err, resp) {
    if(err) return next(err);
    var data = JSON.parse(resp.body);
    var date = moment(data.data.index[0].upd_date[0], 'YYYYMMDD');
    
    app.models.yandexUpdates.update({date: date}, {date: date}, {
      upsert: true,
      multi: false
    }, function (err) {
      if (err) app.log.error("Error when trying to insert data to DB: " + err);
    });
    next();
  });
}

function setToken(app, site, next) {
  var log = app.log;
  app.services.google.setCredentials(site.tokens);
  if (!site.tokens.refresh_token) return;

  app.services.google.refreshAccessToken(function (err, tokens) {
    if(err || !tokens) {
      return next(err || 'No tokens from GA refresh!');
    }
    app.services.google.setCredentials(tokens);
    if (!tokens.refresh_token) return next();

    site.tokens = tokens;
    log.info('Tokens refreshed: '+JSON.stringify(tokens));
    site.save(next);
  });
}