/**
 * Tasks service class
 * @module services/tasks/TaskSvc
 * @copyright 2015 Cannasos.com. All rights reserved.
 */
'use strict';

var async = require('async'),
  path = require('path'),
  fs = require('fs'),
  logger = require('./log.js');


var dirWalk = exports.dirWalk = function(dir, cb) {
  var results = [];
  fs.readdir(dir, function (err, list) {
    if (err) { return cb(err); }
    var i = 0;
    (function next() {
      var file = list[i];
      i += 1;
      if (!file) {
        return cb(null, results);
      }
      file = path.join(dir, file);
      fs.stat(file, function (err, stat) {
        if (err) { return cb(err); }
        if (stat && stat.isDirectory()) {
          dirWalk(file, function (err, res) {
            if (err) { return cb(err); }
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

exports.getPlugins = function(dir, next) {
  var plugins = {};

  async.auto({
    fileList: function (next) {
      dirWalk(dir, next);
    },
    plugins: ['fileList', function (next, res) {
      async.each(res.fileList, function (filePath, next) {
        if (path.extname(filePath) !== '.js') { return next(); }

        var plugin = require(filePath);
        logger().debug('Loading plugins from file "%s"', filePath);
        for (var name in plugin) {
          if (plugin.hasOwnProperty(name)) {
            plugins[name] = plugins[name] || [];
            plugins[name].push(plugin[name]);
          }
        }
        next();
      }, next);
    }]
  }, function(err) {
    if (err) { return next(err); }

    next(null, plugins);
  });
};