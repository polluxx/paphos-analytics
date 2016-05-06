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

router.get('/:projectId/refresh', function(req, res, next) {
  req.app.services.tasks.publish('pages.scan', { _id: req.params.projectId });
  res.json({message: 'done'});
});

router.get('/:id/keywords', function (req, res, next) {
  async.auto({
    'page': next => {
      req.app.models.pages.findById(req.params.id, next);
    },
    'keywords': ['page', (next, result) => {
      console.log(result.page);
      if(!result.page.keywords) return next('No keywords for page.');

      req.app.models.keywords.find({word: {$in: result.page.keywords}}, next);
    }]
  }, (err, data) => {
    if (err) { return next(err); }

    res.json(data.keywords);
  });
});

//test route

router.get('/task', function(req, res, next) {

  if(!req.query.subtask) {
    return next('No subtask!');
  }
  req.app.services.tasks.publish('pages.scanAll', { subtask: req.query.subtask });
  res.json({message: 'done'});
});


module.exports = router;