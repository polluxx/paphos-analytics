'use strict';

var router = require('express').Router(),
  moment = require('moment'),
  _ = require('lodash'),
  async = require('async');

router.get('/:id', function (req, res, next) {
  req.app.models.queries.find({ 'page._id': req.params.id }, function(err, data) {

    res.json(data)
  });
});

module.exports = router;