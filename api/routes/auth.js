'use strict';

var router = require('express').Router(),
  moment = require('moment'),
  _ = require('lodash'),
  async = require('async');

router.get('/google', function (req, res, next) {
  req.app.services.google.generateAuthUrl(function(err, url) {
    res.json({ url: url });
  });
});

router.get('/google/callback', function (req, res, next) {
  async.auto({
    'tokens': function(next) {
      req.app.services.google.getToken(req.query.code, next);
    },
    'webmasters': ['tokens', function(next, data) {
      req.app.services.webmasters.syncAccount(data.tokens, next);
    }],
    'analytics': ['tokens', 'webmasters', function(next, data) {
      req.app.services.analytics.syncAccount(data.tokens, next);
    }]
  }, function(err) {
    if (err) { return next(err); }
    res.redirect('http://localhost:3000/#/analytics/');
  });
});



module.exports = router;