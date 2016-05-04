'use strict';

var router = require('express').Router(),
  moment = require('moment'),
  _ = require('lodash'),
  async = require('async');

router.get('/:id/queries', function (req, res, next) {
  async.auto({
    'page': function() {
      req.app.models.pages.findById(req.params.id, next);
    },
    'queries': ['site', function(next, data) {
      req.app.models.queries.find({ 'page._id': data.page._id }, next);
    }]
  }, function(err, data) {
    if (err) { return next(err); }

    res.json(data.queries)
  });
});

router.get('/:id/refresh', function(req, res, next) {
  req.app.services.tasks.publish('pages.scan', { _id: req.params.id });
  res.json({message: 'done'});
});

module.exports = router;