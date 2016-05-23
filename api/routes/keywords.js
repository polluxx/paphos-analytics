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

module.exports = router;
