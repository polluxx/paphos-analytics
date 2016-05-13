'use strict';

var router = require('express').Router(),
  moment = require('moment'),
  _ = require('lodash');

router.get('/', function (req, resp, next) {
  var params = req.query,
    dateFrom = moment(params.dateFrom, "YYYY-MM-DD"),
    dateTo = moment(params.dateTo, "YYYY-MM-DD"),
    diff = dateFrom.diff(dateTo, 'days');
  req.app.models.keywords.find({siteId: params.siteId}, function(err, result) {
    if(err) return next(err);

    result = result.map(function(record) {
      var positions = [];
      for (var date = moment(dateFrom); date.isSameOrBefore(dateTo); date.add(1, 'day')) {
        var position = _.find(record.positions, { date: date.format('YYYY-MM-DD') })
        positions.push(position ? position.position : '-')
      }
     record.positions = positions;
      return record;
    });

    resp.json(result);
  }).limit(params.perPage);
});

module.exports = router;
