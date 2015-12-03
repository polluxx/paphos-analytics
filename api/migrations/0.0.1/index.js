'use strict';

var async = require('async'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash');

exports.getInfo = function () {
  return ['0.0.1'];
};

exports.migrate = function (app, cb) {
  return cb();
};
