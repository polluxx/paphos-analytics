'use strict';

var router = require('express').Router(),
  moment = require('moment'),
  _ = require('lodash'),
  async = require('async');

router.get('/', function (req, res, next) {
  var params = req.query,
    dateFrom = moment(params.dateFrom, "YYYY-MM-DD"),
    dateTo = moment(params.dateTo, "YYYY-MM-DD");

    async.auto({
      count: function(next) {
        req.app.models.keywords.count({siteId: params.siteId}, next);
      },
      keywords: function(next) {
        var opts = {};
        if (req.query['perPage']) {
          opts.skip = req.query['page'] ? (req.query['page'] - 1) * req.query['perPage'] : "-";
          opts.limit = req.query['perPage'];
        }
        req.app.models.keywords.find({siteId: params.siteId}, {}, opts, next);
      }
    }, function(err, data) {
      if(err) return next(err);

      var result = data.keywords.map(function(record) {
        var positions = {
          google: [],
          yandex: []
        }, date, positionGoogle, positionYandex;

        for (date = moment(dateFrom); date.isSameOrBefore(dateTo); date.add(1, 'day')) {
          positionGoogle = _.find(record.positions, { date: date.format('YYYY-MM-DD'), service: 'google' });
          positionYandex = _.find(record.positions, { date: date.format('YYYY-MM-DD'), service: 'yandex' });

          positions.google.push(positionGoogle ? positionGoogle.position : '-');
          positions.yandex.push(positionYandex ? positionYandex.position : '-');
        }
        record.positions = positions;

        return record;
      });
      if (data.count !== -1) {
        res.set('x-total-count', data.count);
      }
      res.json(result);
    });

});

router.get('/pageAnalytics', function(req, res, next) {
  var params = req.query,
    date = {
      startDate: params.dateFrom,
      endDate: params.dateTo
    },
    pageId = params.pageId;
    if(!pageId) return next('No pageId param!');
    async.auto({
      page: next => {
        req.app.models.pages.findOne({_id: params.pageId}, next);
      },
      project: ['page', (next, data) => {
        if(!data.page) return next('No page found.');
        req.app.models.sites.findOne({_id: data.page.siteId}, next);
      }],
      keywords: ['page', (next, data) => {
        if(!data.page) return next('No page found.');
        req.app.models.keywords.find({word: {$in: data.page.keywords}}, next);
      }],
      analytics: ['page', 'project', 'keywords', (next, data) => {
        if(!data.page || !data.project || !data.keywords) return next('No data.');

        var options = {
          profileId: data.project.analytics.profileId,
          metrics: ['ga:pageviews'],
          dimensions: ['ga:keyword', 'ga:date'],
          filters: 'ga:pagePath=@' + data.page.url,
          date: date,
          sort: '-ga:pageviews, -ga:date'
        }, filter = ['(not provided)', '(not set)'];

        req.app.services.analytics.getMetricsByUrl(options, (err, response) => {
          if(err) return next(err);
          res.json(response.rows.filter(keyword => {
            return !~filter.indexOf(keyword[0]);
          }).map(keyword => {
            return [keyword[0], moment(keyword[1], 'YYYYMMDD').format('DD/MM/YYYY'), keyword[2]];
            // return {keyword: keyword[0], date:moment(keyword[1], 'YYYYMMDD').format('DD/MM/YYYY'), pageviews: keyword[2]};
          }));
        });
      }]
    }, (err) => {
      if(err) res.json(err);
    });
});

module.exports = router;
