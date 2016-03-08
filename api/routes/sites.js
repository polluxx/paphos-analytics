'use strict';

var router = require('express').Router(),
  moment = require('moment'),
  _ = require('lodash'),
  async = require('async');

router.get('/:id', function (req, res, next) {
  var fields = ['isActive'],
    update = _.pick(req.body, fields);

  async.auto({
    'site': function(next) {
      req.app.models.sites.findOne({ _id: req.params.id }, next);
    },
    'token': ['site', function(next, data) {
      var expiredDate = moment(data.site.tokens.expiry_date);
console.info(data.site);
      if (!expiredDate.isBefore(moment())) {
      //  return next(null, data.site.tokens.access_token);
      }
      req.app.services.google.setCredentials(data.site.tokens);
      req.app.services.google.refreshAccessToken(function (err, tokens) {
        console.info(err, tokens)
        data.site.tokens = tokens;
        data.site.save(function(err) {
          if (err) { return next(err); }

          req.app.services.analytics.syncAccount(tokens, function() {

            next(null, tokens.access_token);
          });

        });
      });
    }]
  }, function(err, data) {
    if (err) { return next(err); }

    res.json(data.site);
  });
});

router.post('/find', function (req, res, next) {
  var urls = _.map(req.body, function(item) {
    return _.trim(item, '/');
  });
  req.app.models.sites.find({ siteUrl: { $in: urls } }, function(err, data) {
    data = _.map(urls, function(item) {
      return _.find(data, { siteUrl: item }) ||  { siteUrl: item, isUnknown: true };
    });
    res.json(data)
  });
});

router.put('/:id', function (req, res, next) {
  var fields = ['isActive'],
    update = _.pick(req.body, fields);

  req.app.models.sites.update({ _id: req.params.id }, { $set: update }, function(err, data) {
    res.status(204).send();
  });
});

router.post('/:id/scan', function (req, res, next) {
  req.app.models.sites.findById(req.params.id, function(err, item) {
    if (err) { return next(err); }
    if (!item) {
      return next(req.app.errors.NotFoundError('Item not found.'));
    }
    req.app.services.tasks.publish('sites.scanSite', { _id: item._id });
    res.status(204).end();
  });
});

module.exports = router;