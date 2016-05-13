'use strict';

var async = require('async'),
  _ = require('lodash'),
  request = require('request'),
  moment = require('moment'),
  limiter = require('limiter');

exports['pages.scan'] = function(app, message, callback) {
  var log = app.log,
    rateLimiter = limiter.RateLimiter,
    limitService = new rateLimiter(1, 'second');

  if(!message.body._id) return callback('No id provided!');

  async.auto({
    project: function (next) {
      app.models.sites.findById(message.body._id, next);
    },
    pages: ['project', function(next, data) {

      if(!data.project) return next('No projects provided!');

      var project = data.project,
        pager = 1,
        insertOptions = {
          upsert: true,
          multi: false
        },
        insertData = {},
        insertCondition = {},
        url,
        end = false;

        for(var i=0;i<100;i++) {
          limitService.removeTokens(1, function (err) {
            if (err) {
              return next(err);
            }


            if (end) return;

            log.info(' ------ Start getting project: ' + project.siteUrl + " page: " + pager + " ------");

            request({url: 'http://' + project.siteUrl + "/api/posts?perPage=100&fields=category,alias,title,seo&page=" + pager},
              function (err, data, body) {
                pager++;
                if (err || data.statusCode !== 200) {
                  end = true;
                  return next(err || "Error code: " + data.statusCode);
                }

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
                    searchPage: pager,
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

      }]
    });
};

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
      if(limitChance >=3) {
        log.info('More than 3 attempts failed when getting xml limits!');
        return cb();
      }
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
      if(!limit) limit = 200;

      app.models.keywords.find(
        {
          $or:
          [
            {updated: {$lt: new Date(moment().format("MM/DD/YYYY"))}},
            {updated: {$exists: false}}
          ]}, next).limit(limit);
    }],
    yandex: ['pages', 'limit', (next, data) => {
      if(!data.pages.length || !data.limit) return next();

      limitService = new rateLimiter(data.pages.length, 'hour');

      data.pages.forEach(page => {

        limitService.removeTokens(1, function (err, remainingRequests) {
          if (err) {
            return next(err);
          }

          // YANDEX START
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
          // YANDEX END

        });
      });

      next();
    }],
    google: ['pages', (next, data) => {
      console.log(data.pages);
      if(!data.pages.length) return next();
      limitService = new rateLimiter(15, 'minute');

      data.pages.forEach(page => {

        limitService.removeTokens(1, function (err, remainingRequests) {
          if (err) {
            return next(err);
          }

          // GOOGLE
          scanGooglePosition(app, page);

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

  if(!message.body._id) return callback('No id provided!');

  async.auto({
    site: next => {
      app.models.sites.findById(message.body._id, next);
    },
    pages: ['site', (next, data) => {
      console.log(data.site._id);
      app.models.pages.find({siteId: data.site._id}, next);
    }],
    top: ['site', 'pages', (next, data) => {
      var site = data.site;

      if(!site.analytics || !site.analytics.profileId) {
        return next('No analytics for site:'+site._id);
      }

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

              console.log(response);

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

};

exports['pages.scanAllTop'] = function(app, message, callback) {
  sendTaskToProjects('pages.top', app, callback);
};

exports['pages.scanAll'] = function(app, message, callback) {
  sendTaskToProjects('pages.scan', app, callback);
};

function sendTaskToProjects(task, app, callback) {
  var log = app.log;

  async.auto({
    sites: function (next) {
      app.models.sites.find({}, next);
    },
    scan: ['sites', (next, data) => {
      if(!data.sites) return next('No data to process.');

      data.sites.forEach(record => {
        app.services.tasks.publish(task, { _id: record._id });
      });
      next();
    }]
  }, callback);
}

function scanGooglePosition(app, keyword) {
  var log = app.log, siteUrl;
  // start getting dara from Google Search
  async.auto({
    project: next => {
      app.models.sites.findOne({_id: keyword.siteId}, next);
    },
    position: ['project', (next, data) => {
      console.log(keyword.word);

      siteUrl = data.project.siteUrl;
      siteUrl = /http/.test(siteUrl) ? siteUrl : "http://" + siteUrl;

      app.services.googleSvc.getUrlPosition(siteUrl, encodeURIComponent(keyword.word),
        {
          count: 100,
          regex: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})/
        }, next);
    }],
    save: ['position', (next, data) => {
      console.log(data.position);
      app.models.keywords.update(
        {_id: keyword._id},
        {
          $addToSet: {
            positions: {
              date: moment(new Date()).format("YYYY-MM-DD"),
              position: data.position
            }
          },
          updated: Date.now()
        },
        {upsert: false, multi: false},
        next);
    }]
  }, err => {
    if(err) log.error(err);
  });
}
