var logger = require('../lib/paphos/log.js'),
  _ = require('lodash'),
  async = require('async');

function AnalyticsService(app, googleService) {
  var log = this.log = logger().child({module: 'AnalyticsService'});
  this.app = app;
  this.service = googleService;

  this.api = googleService.analytics();
};

AnalyticsService.prototype.init = function (next) {
  next();
};
AnalyticsService.prototype.start = function (next) {
  next();
};
AnalyticsService.prototype.syncAccount = function(tokens, next) {
  var self = this,
    api = this.api,
    app = self.app;

  async.auto({
    'analyticSites': function(next) {
      api.management.accountSummaries.list({}, function(err, data) {
        if (err) { return next(err); }
console.info(data)
        var items = [];
        _.each(data.items, function(item) {
          items = items.concat(item.webProperties);
        });
        next(null, items);
      });
    },
    'dbSites': ['analyticSites', function(next, data) {
      var urls = _.pluck(data.analyticSites, 'websiteUrl');
      urls = _.map(urls, function(item) {
        return _.trim(item, '/').toLowerCase();
      });
      app.models.sites.find({ siteUrl: { $in: urls } }, next);
    }],
    'saveTokens': ['dbSites', function(next, data) {
      async.each(data.analyticSites, function(site, next) {
        site.websiteUrl = _.trim(site.websiteUrl, '/').toLowerCase();
        var dbItem = _.find(data.dbSites, { siteUrl: site.websiteUrl });
        if (!dbItem) {
          dbItem = new app.models.sites({ siteUrl: site.websiteUrl });
        }
        if (!site.profiles.length) {
          return next();
        }
        dbItem.services.analytics = true;
        dbItem.tokens = tokens;
        dbItem.analytics = {
          webPropertyId: site.id,
          profileId: site.profiles[0].id
        };
        dbItem.save(next);
      }, next);
    }]
  }, next);
};

AnalyticsService.prototype.syncReports = function(query, next) {
  var self = this,
    api = this.api,
    app = self.app;

  query.siteUrl = encodeURIComponent(query.siteUrl);

  api.analytics.query(query, function(err, data) {
    next(err, data);
  });
};

AnalyticsService.prototype.syncStatisticForDay = function(site, date, next) {
  var app = this.app;

  app.services.analytics.searchAnalytics({
    siteUrl: site.siteUrl,

    resource: {
      dimensions: ['query', 'page', 'country', 'device'],
      startDate: date,
      endDate: date
    }
  }, function(err, res) {
    if (err) { return next(err); }

    async.eachSeries(res.rows, function(row, next) {
      async.auto({
        'query': function(next) {
          app.models.queries.ensureExists(row.keys[0], site, next);
        },
        'page': function(next) {
          app.models.pages.ensureExists(row.keys[1], site, next);
        },
        'statistic': ['query', 'page', function(next, res) {
          app.models.statistics.ensureExists(res.page, res.query, site, date, function(err, stat) {
            if (err) { return next(err); }

            stat.country = row.keys[2];
            stat.device = row.keys[3];
            stat.clicks = row.clicks;
            stat.ctr = row.ctr;
            stat.impressions = row.impressions;
            stat.position = row.position;
            stat.save(next);
          });
        }]
      }, next);
    }, next);
  });
};

module.exports = AnalyticsService;