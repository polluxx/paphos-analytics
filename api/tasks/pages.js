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
    yandexXmlUrl= config.xml.wordstat,
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
      yandex.getLimits(config.xml.limits, new Date(), function (err, response) {
        yandexLimitResponse(err, response, next);
      });
    },
    pages: ['limit', (next, data) => {
      var limit = data.limit || 100;
      app.models.keywords.find(
        {
          $or:
          [
            {updated: {$lt: new Date(moment().format("MM/DD/YYYY"))}},
            {updated: {$exists: false}}
          ]}, next).limit(limit);
    }],
    yandexReport: ['pages', (next, data) => {
      if(!data.pages || !data.pages.length) return next();

      startYandexReport(app, data.pages.map(page => page.word));

      next();
    }],
    yandexSearch: ['pages', (next, data) => {
      if(!data.pages || !data.pages.length) return next();
        var apiUrl =  app.config.get('yandex.xml.search'), siteUrl;

        limitService = new rateLimiter(6, 'minute');

        data.pages.forEach(page => {
          limitService.removeTokens(1, function (err, remainingRequests) {
            if (err) {
              return next(err);
            }

            getSiteUrlByKeyword(app, page, (err, data) => {
              if(err) return next(err);

              siteUrl = data.siteUrl;
              siteUrl = /http/.test(siteUrl) ? siteUrl : "http://" + siteUrl;
              var args = [{yandexXml: apiUrl}, siteUrl, page.word,
                {
                  count: 100,
                  regex: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})/
                }];

              scanPosition(app, page, app.services.yandex, 'yandex', args);
            });

          });
        });

        next();
    }],
    google: ['pages', (next, data) => {
      console.log(data.pages);
      if(!data.pages.length) return next();
      limitService = new rateLimiter(6, 'minute');
       var siteUrl;
      data.pages.forEach(page => {

        limitService.removeTokens(1, function (err, remainingRequests) {
          if (err) {
            return next(err);
          }

          // GOOGLE
          getSiteUrlByKeyword(app, page, (err, data) =>
          {
            if (err) return next(err);

            siteUrl = data.siteUrl;
            siteUrl = /http/.test(siteUrl) ? siteUrl : "http://" + siteUrl;
            var args = [siteUrl, encodeURIComponent(page.word),
              {
                count: 100,
                regex: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})/
              }];
              scanPosition(app, page, app.services.googleSvc, 'google', args);
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

function scanPosition(app, keyword, service, serviceName, args) {
  var log = app.log, siteUrl;
  // start getting data from Search
  async.auto({
    position: (next) => {
      console.log('keyword for service', keyword.word, serviceName);

      args.push(next);
      service.getUrlPosition.apply(service, args);
    },
    save: ['position', (next, data) => {
      console.log('position', data.position);

      app.models.keywords.update(
        {_id: keyword._id},
        {
          $addToSet: {
            positions: {
              date: moment(new Date()).format("YYYY-MM-DD"),
              position: data.position,
              service: serviceName
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

function startYandexReport(app, keywords) {
  var rateLimiter = limiter.RateLimiter,
  limitService = new rateLimiter(3, 'minute');

  async.auto({
    sitesTokens: next => {
      app.models.sites.find({}, 'yandexTokens', next);
    },
    api: ['sitesTokens', (next, data) => {
      var tokenObj = data.sitesTokens[0].yandexTokens;
      app.services.yandexWds.init(tokenObj.token, next);
    }],
    createReport: ['api', (next, data) => {
      app.services.yandexWds.createWordstatReport(keywords, data.api, next);
    }],
    checkReport: ['createReport', (next, data) => {
      console.log(data);
      // limitService.removeTokens(1, function (err, remainingRequests) {
      //   app.services.yandexWds.listWordstatReports(data.data, function(error, response) {
      //     if(error) return next(error);
      //
      //     console.log(response);
      //     next()
      //   });
      // });
      next();
    }],
    report: ['checkReport', (next, data) => {
      next();
    }],
    deleteReport: ['report', (next, data) => {
      next();
    }]
  }, error => {
    if(error) app.log.error("Error on yandex report:", error);
  });
}

function getSiteUrlByKeyword(app, keyword, next) {
  app.models.sites.findOne({_id: keyword.siteId}, next);
}