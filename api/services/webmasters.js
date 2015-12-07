var logger = require('../lib/paphos/log.js'),
  _ = require('lodash'),
  async = require('async');

function WebmastersService(app, googleService) {
  var log = this.log = logger().child({module: 'WebmastersService'});
  this.app = app;
  this.service = googleService;

  this.api = googleService.webmasters();
};

WebmastersService.prototype.init = function (next) {
  next();
};
WebmastersService.prototype.start = function (next) {
  next();
};
WebmastersService.prototype.syncAccount = function(tokens, next) {
  var self = this,
    api = this.api,
    app = self.app;

  async.auto({
    'webmasterSites': function(next) {
      api.sites.list({}, function(err, data) {
        next(err, data.siteEntry);
      });
    },
    'dbSites': ['webmasterSites', function(next, data) {
      var urls = _.pluck(data.webmasterSites, 'siteUrl');
      urls = _.map(urls, function(item) {
        return _.trim(item, '/').toLowerCase();
      });
      app.models.sites.find({ siteUrl: { $in: urls } }, next);
    }],
    'saveTokens': ['dbSites', function(next, data) {
      async.each(data.webmasterSites, function(site, next) {
        site.siteUrl = _.trim(site.siteUrl, '/').toLowerCase();
        var dbItem = _.find(data.dbSites, { siteUrl: site.siteUrl });
        if (!dbItem) {
          dbItem = new app.models.sites(site);
        }
        dbItem.services.webmaster = true;
        dbItem.tokens = tokens;
        dbItem.save(next);
      }, next);
    }]
  }, next);
};

WebmastersService.prototype.searchAnalytics = function(query, next) {
  var self = this,
    api = this.api,
    app = self.app;

  query.siteUrl = encodeURIComponent(query.siteUrl);

  api.searchanalytics.query(query, function(err, data) {
    next(err, data);
  });
};

WebmastersService.prototype.syncStatisticForDay = function(site, date, next) {
  var app = this.app;

  app.services.webmasters.searchAnalytics({
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
          console.info(res);
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

module.exports = WebmastersService;