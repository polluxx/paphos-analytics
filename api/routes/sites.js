'use strict';

var router = require('express').Router(),
  moment = require('moment'),
  _ = require('lodash'),
  async = require('async');

router.post('/:id/refresh', function (req, res, next) {
  var fields = ['isActive'],
    update = _.pick(req.body, fields);

  async.auto({
    'site': function(next) {
      req.app.models.sites.findOne({ _id: req.params.id }, next);
    },
    'token': ['site', function(next, data) {
      var expiredDate = moment(data.site.tokens.expiry_date);

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
            console.log('refresh tokens', tokens);
            next();
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
  req.app.models.sites.find(req.params, function(err, data) {
    res.json(data)
  });
});

router.get('/yandexUpdates', function(req, res, next) {
  var params = req.query,
    dateFrom = moment(params.dateFrom, "YYYY-MM-DD"),
    dateTo = moment(params.dateTo, "YYYY-MM-DD");
  
  req.app.models.yandexUpdates.find({date: {
    $gte: dateFrom,
    $lte: dateTo
  }}, function (err, resp) {
    if(err) return next(err);

    res.json(resp);
    //next();
  });
});

router.put('/', function (req, res, next) {
  var fields = ['siteUrl'],
    insert = _.pick(req.body, fields);
  console.log(insert);
  req.app.models.sites.collection.insert(insert, function(err, data) {
    console.log(err);
    if(err) {
      return next(err);
    }
    res.status(204).send();
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

router.delete('/:id/temp', function(req, res, next) {
  if(!req.params || !req.params.id) return res.status(406).send();

  req.app.models.tempSites.remove({_id: req.params.id}, function(err, data) {
    if(err) return res.status(500).send({error: err});

    res.json({deleted: data});
  });
});

module.exports = router;