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
        end = false;

      res.projects.forEach(function(project) {
          pager[project] = {page:1};


          //do {
            for(var i=0;i<100;i++) {
              limitService.removeTokens(1, function (err) {
                if (err) {
                  return next(err);
                }


                if (end) return;

                log.info(' ------ Start getting project: ' + project.siteUrl + " page: " + pager[project].page + " ------");

                request({url: 'http://' + project.siteUrl + "/api/posts?perPage=100&fields=category,alias,title&page=" + pager[project].page},
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
                        siteId: project._id
                      };

                      app.models.pages.update(insertCondition, insertData, insertOptions, function (err) {
                        if (err) {
                          log.error("Error when trying to insert data to DB: " + err);

                        }
                      });

                    });

                  });
              });
            }
          //} while(end || pager[project].page <= 2);
      });

      }]
    });

}