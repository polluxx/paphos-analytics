var logger = require('paphos-core').log,
  _ = require('lodash'),
  moment = require('moment'),
  momentRange = require('moment-range'),
  async = require('async'),
  limiter = require('limiter'),
  request = require('request'),
  xml2js = require('xml2js');

function AnalyticsService(app, googleService) {
  var log = this.log = logger().child({module: 'AnalyticsService'});
  this.app = app;
  this.service = googleService;

  this.api = googleService.analytics();
  //console.info(this.api )
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

        var items = [];
        _.each(data.items, function(item) {
          items = items.concat(item.webProperties);
        });
        next(null, items);
      });
    },
    'allSites': ['analyticSites', function(next, data) {

      var urls = _.pluck(data.analyticSites, 'websiteUrl');
      urls = _.map(urls, function(item) {
        return _.trim(item, '/').toLowerCase().replace(/((http|https):\/\/)|www\./ig, "");
      });
      next(null, urls);
    }],
    'dbSites': ['allSites', function(next, data) {
      app.models.sites.find({ siteUrl: { $in: data.allSites } }, next);
    }],
    'saveTokens': ['analyticSites', 'dbSites', function(next, data) {
      var tokenSites = [];
      console.log('data.analyticSites', data.analyticSites);
      async.each(data.analyticSites, function(site, next) {
        site.websiteUrl = _.trim(site.websiteUrl, '/').toLowerCase().replace(/((http|https):\/\/)|www\./ig, "");

        var dbItem = _.find(data.dbSites, { siteUrl: site.websiteUrl });
        console.log('find DB sites', dbItem);
        if (!dbItem || !site.profiles.length) {
          return next();
        }
        dbItem.services.analytics = true;
        dbItem.tokens = tokens;
        dbItem.analytics = {
          webPropertyId: site.id,
          profileId: site.profiles[0].id
        };
        console.log('dbItem', dbItem);
        dbItem.save(next);
      }, next);
    }],
    'tempList': ['allSites', function(next, data) {
      var tempList = data.allSites.map(site => {
        return {siteUrl: site, tokens: tokens};
      });

      next(null, tempList);
    }]
  }, next);
};

AnalyticsService.prototype.syncReports = function(site, startDate, endDate, next) {
  var self = this,
    api = this.api,
    app = self.app;


  var range = moment.range(startDate, endDate);
  var rateLimiter = limiter.RateLimiter,
    limitService = new rateLimiter(2, 'second');

  range.toArray('days').map(function(moment) {

    limitService.removeTokens(1, function(err) {
      if (err) { return next(err); }

      api.data.ga.get({
        'ids': 'ga:' + site.analytics.profileId,
        'start-date': moment.format('YYYY-MM-DD'),
        'end-date': moment.format('YYYY-MM-DD'),
        'metrics': 'ga:sessions,ga:users',
        'dimensions': 'ga:pagePath',
        'sort': '-ga:users'
      }, function(err, res) {
        if (err) { return next(err); }

        async.eachLimit(res.rows, 1, function(item, next) {
          console.log('res.rows item', item);
          async.auto({
            'page': function(next) {
              app.models.pages.ensureExists(item[0], site, next);
            },
            'visits': ['page', function(next, data) {
              app.models.visitStatistics.ensureExists(data.page, site, moment.toDate(), next);
            }]
          }, function(err, data) {
            if (err) { return next(err); }

            console.info('analytics page', item);
            data.visits.sessions = item[1];
            data.visits.users = item[2];
            data.visits.save(next);
          });
        }, next);
      });

    });

  });
};


AnalyticsService.prototype.syncReportsForSite = function(site, startDate, endDate, next) {
  var self = this,
    api = this.api,
    app = self.app;


  var range = moment.range(startDate, endDate);
  var rateLimiter = limiter.RateLimiter,
    limitService = new rateLimiter(2, 'second');

  range.toArray('days').map(function(momentDate) {

    limitService.removeTokens(1, function(err) {
      if (err) { return next(err); }

      api.data.ga.get({
        'ids': 'ga:' + site.analytics.profileId,
        'start-date': momentDate.format('YYYY-MM-DD'),
        'end-date': momentDate.format('YYYY-MM-DD'),
        'metrics': 'ga:sessions,ga:users',
        'sort': '-ga:users'
      }, function(err, res) {
        if (err) { return next(err); }

        var dateToSet = moment(momentDate.format('YYYY-MM-DD'));
        async.eachLimit(res.rows, 1, function(item, next) {
          app.models.visitStatistics.update({
            'site._id': site._id,
            date: dateToSet.toDate()
          }, {
            'site._id': site._id,
            date: dateToSet.toDate(),
            sessions: item[0],
            pageviews: item[1],
          }, {upsert:true, multi:false}, next);
        }, next);
      });

    });

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

AnalyticsService.prototype.getMetricsByUrl = function (options, next) {
  var app = this.app,
    api = this.api,
    date = options.date || {
        startDate: moment().format('YYYY-MM-DD'),
        endDate: moment().format('YYYY-MM-DD')
      },
    dimensions = options.dimensions || ['ga:pagePath', 'ga:date'],
    metrics = options.metrics || ['ga:pageviews'];


  api.data.ga.get({
    'ids': 'ga:' + options.profileId,
    'start-date': date.startDate,
    'end-date': date.endDate,
    'metrics': metrics.join(','),
    'dimensions': dimensions.join(','),
    filters: options.filters || '',
    sort: options.sort || null
  }, function(err, res) {
    if (err) {
      return next(err);
    }

    return next(null, res);
  });

}

AnalyticsService.prototype.getYandexUpdates = function(next) {
  var app = this.app,
  parser = new xml2js.Parser();
  request(app.config.get('yandex.updates'), function(err, resp, body) {
    if(err) return next(err);

    parser.parseString(resp.body, function (err, result) {
      if(err) return next(err);

      var response = {
        status: resp.statusCode,
        body: JSON.stringify(result)
      };
      next(null, response);
    });
  })
}

module.exports = AnalyticsService;