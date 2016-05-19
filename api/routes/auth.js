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

router.get('/yandex', function (req, res, next) {
  req.app.services.yandexWds.getAuthCode(function(err, url) {
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
    }],
    'saveTempSites': ['analytics', function(next, data) {
      if(!data.analytics || !data.analytics.tempList) return next();

      var updateParams = {upsert: true, multi: false}, insertData;
      data.analytics.tempList.forEach(function(site) {
        insertData = {siteUrl: site.siteUrl, token: site.token};
        req.app.models.tempSites.update({siteUrl: site.siteUrl}, insertData, updateParams, function (err) {
          if(err) req.app.log.error(err);
        });
      });
      next();
    }]
  }, function(err) {
    if (err) { return next(err); }

    res.send('<script>window.close();</script>');
  });
});

router.get('/yandex/callback', function (req, res, next) {
  async.auto({
    'tokens': function(next) {
      req.app.services.yandexWds.getToken(req.query.code, next);
    },
    'analytics': ['tokens', function(next, data) {
      req.app.services.yandexWds.syncAccount(data.tokens, next);
    }]
  }, function(err) {
    if (err) { return next(err); }
    res.send('<script>window.close()</script>')
  });
});


module.exports = router;