'use strict';

var async = require('async'),
  _ = require('lodash'),
  request = require('request'),
  limiter = require('limiter');

exports['pages.scan'] = function(app, message, callback) {
  var log = app.log,
    rateLimiter = limiter.RateLimiter,
    limitService = new rateLimiter(1, 'second');

  async.auto({
    projects: function (next) {
      app.models.sites.find({}, next);
    },
    pages: ['projects', function(next, res) {

      if(!res.projects) return next('No projects provided!');

      var pager = {}, err = null,
        insertOptions = {
          upsert: true,
          multi: false
        },
        insertData = {},
        insertCondition = {},
        url,
        end = false,
        keywords = [];

      res.projects.forEach(function(project) {
          pager[project] = {page:1};

          for(var i=0;i<100;i++) {
            limitService.removeTokens(1, function (err) {
              if (err) {
                return next(err);
              }


              if (end) return;

              log.info(' ------ Start getting project: ' + project.siteUrl + " page: " + pager[project].page + " ------");

              request({url: 'http://' + project.siteUrl + "/api/posts?perPage=100&fields=category,alias,title,seo&page=" + pager[project].page},
                function (err, data, body) {
                  pager[project].page++;
                  if (err || data.statusCode !== 200) return next(err || "Error code: " + data.statusCode);

                  data = JSON.parse(body);
                  console.log("DATA: " + data.length);

                  if (!data.length) end = true;

                  data.forEach(page => {

                    if (!page.category) return;

                    url = [page.category.parentAlias, page.category.alias, page.alias].join("/");
                    insertCondition.url = url;
                    insertData = {
                      url: url,
                      title: page.title,
                      searchPage: pager[project].page,
                      siteId: project._id,
                      keywords: page.seo.keywords.map(keyword => {return keyword.title;})
                    };

                    app.models.pages.update(insertCondition, insertData, insertOptions, function (err) {
                      if (err) log.error("Error when trying to insert data to DB: " + err);
                    });

                    page.seo.keywords.forEach(word => {
                      word.siteId = project._id;
                      app.models.keywords.update({word: word.title}, word, insertOptions, function (err) {
                        if (err) log.error("Error when trying to insert data to DB: " + err);
                      });
                    });
                  });

                });
            });
          }

      });

      }]
    });
}

exports['pages.keywords'] = function(app, message, callback) {
  var log = app.log,
    yandex = app.services.yandex,
    config = app.config.get('yandex'),
    yandexConf = {yandexXml: config.xml.search},
    group, updateFields, searchCondition,
    rateLimiter = limiter.RateLimiter,
    limitService;

  var limitChance = 1;
  function yandexLimitResponse(err, response, cb) {
    log.info("Get limit from yandex: attempt - "+limitChance);
    if(err) {
      if(limitChance >=3) return cb('More than 3 attempts failed when getting xml limits!');
      limitChance++;
      return yandex.getLimits(config.xml.limits, new Date(), function (err, response) {
        return yandexLimitResponse(err, response, cb);
      });
    }

    return cb(null, response);
  }

  async.auto({
    limit: next => {
      yandex.getLimits(config.xml.limits, new Date(), function(err, response) {
        yandexLimitResponse(err, response, next);
      });
    },
    pages: ['limit', (next, data) => {
      var limit = parseInt(data.limit);
      limitService = new rateLimiter(limit, 'hour');
      app.models.keywords.find(
        {
          $or:
          [
            {update: {$lt: 'new Date("<YYYY-mm-dd>")'}},
            {update: {$exists: false}}
          ]}, next).limit(limit);
    }],
    request: ['pages', (next, data) => {
      if(!data.pages) return next();
          data.pages.forEach(page => {

            limitService.removeTokens(1, function (err, remainingRequests) {
              if (err) {
                return next(err);
              }
              yandex.searchByKeyword(yandexConf, page.word, {count: 100}, function (err, report) {
                if (err) {
                  log.error(err);
                  return;
                }

                group = _.find(report.grouping[0].found, {'$': {priority: 'phrase'}});
                searchCondition = {word: page.word};
                updateFields = {frequency: parseInt(group["_"]), updated: Date.now()};

                app.models.keywords.update(searchCondition, updateFields, {upsert: false, multi: false}, function (err) {
                  if (err) log.error(err);
                });
              });
            });
          });

      next();
    }]
  }, callback);
};

exports['pages.top'] = function(app, message, callback) {
  var log = app.log,
    options = {upsert: false, multi: false},
    insert = {},
    query = {},
    rateLimiter = limiter.RateLimiter,
    limitService = new rateLimiter(1, 'second');


  app.models.sites.find({}, function(err, sites) {
    if(err) return callback(err);

    sites.forEach((site) => {
      async.auto({
        pages: next => {
          app.models.pages.find({siteId: site._id}, next);
        },
        top: ['pages', (next, data) => {
          data.pages.forEach((page) => {

            limitService.removeTokens(1, function(err) {
              if (err) { return next(err); }

              app.services.analytics.getMetricsByUrl({
                  filters: 'ga:pagePath=@' + page.url,
                  profileId: site.analytics.profileId
                }, function(err, response) {
                  if(err) {
                    app.log.error(err);
                    return;
                  }
                  query = {url: page.url};
                  insert = {pageviews: response.totalsForAllResults['ga:pageviews']};
                  app.models.pages.update(query, insert, options, (err) => {
                    if(err) app.log.error(err);
                  });
                });
            });
          });
        }]
      }, callback);
    });
  });
};