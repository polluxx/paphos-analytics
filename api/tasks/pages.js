'use strict';

var async = require('async'),
  _ = require('lodash'),
  request = require('request'),
  limiter = require('limiter');

exports['pages.scan'] = function(app, message, callback) {

  var rateLimiter = limiter.RateLimiter,
    limitService = new rateLimiter(2, 'second');

  async.auto({
    projects: function (next) {

      console.log('pages task start');

      app.models.sites.find({}, next);
    },
    pages: ['projects', function(next, data) {
      console.log('pages DB get start');
      if(!data.projects) return next('No projects provided!');

      var projects = data.projects.map(function(project) { console.log(project); return project.siteUrl }),
        page = 1, err = null;

        projects.forEach(function(project) {

          //while(page <= 100 && err === null) {
            console.log(page);
            limitService.removeTokens(1, function (err) {
              if (err) {
                return next(err);
              }

              console.info('Start getting project: '+project+" page: "+page);
              request
                .get('http://' + project + "/api/posts?perPage=100&page="+page, {
                  page: page,
                  perPage: 100,
                  fields: ['category', 'alias', 'title']
                })
                .on('response', function (data) {
                  console.log(data.toJSON());
                })
                .on('error', function (err) {
                  return next(err);
                });
            });
            //page++;
          //}

          //next();

        });
        //next();
      }]
    });

}