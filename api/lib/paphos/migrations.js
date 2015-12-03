'use strict';

var async = require('async'),
  fs = require('fs'),
  path = require('path'),
  _ = require('lodash'),
  logger = require('./log.js'),
  version = require('./models/version.js');

function getVersionInt(str) {
  var versionParts = str.split('.');
  if (versionParts.length > 3) {
    versionParts = _.first(versionParts, 3);
  }
  while (versionParts.length < 3) {
    versionParts.push('0');
  }
  versionParts = _.map(versionParts, function (c) {
    return parseInt(c, 10);
  });
  return versionParts[0] * 65536 + versionParts[1] * 256 + versionParts[2];
}

function getVersion(cb) {
  version.find({}, 'version', {sort: {version: -1}, limit: 1}, function (err, versions) {
    if (err) {
      return cb(err);
    }
    if (versions.length === 0) {
      version.create({version: '0.0.0', description: 'Clean database'}, function (err, version) {
        if (err) {
          return cb(err);
        }
        return cb(null, version.version);
      });
    } else {
      return cb(null, versions[0].version);
    }
  });
}

function getMigrations(dir, cb) {
  var log = logger();
  async.waterfall([
    function (next) {
      fs.readdir(dir, next);
    },
    function (res, next) {
      var names = _.map(res, function (name) {
        log.info('Check migration file:', path.join(dir, name, 'index.js'));
        return path.join(dir, name, 'index.js');
      });
      async.filter(names, fs.exists, _.partial(next, null));
    },
    function (names, next) {
      async.map(names, function (name, nxt) {
        var migration = require(name);
        if (!_.isFunction(migration.migrate)) {
          return nxt(new Error('Migration module "' + name + '" doesn\'t contain function "migrate".'));
        }
        if (!_.isFunction(migration.getInfo)) {
          return nxt(new Error('Migration module "' + name + '" doesn\'t contain function "getInfo".'));
        }
        var info = migration.getInfo();

        var version = getVersionInt(info[0]),
          requiredVersion = (info.length == 1) ? version - 1 : getVersionInt(info[1]);

        log.info({
          version: info[0],
          intVersion: version,
          requiredVersion: requiredVersion,
          migrate: migration.migrate
        });
        return nxt(null, {
          version: info[0],
          intVersion: version,
          requiredVersion: requiredVersion,
          migrate: migration.migrate
        });
      }, next);
    }
  ], cb);
}

function buildMigrationPath(cb, data) {
  var log = logger();
  log.info('Build migrations path');
  var build = function (path) {
    var last = _.last(path);
    if (last.version !== data.version) {
      var prevVersion = _.find(data.migrations, { intVersion: last.requiredVersion });
      if (prevVersion && prevVersion.version !== data.version) {
        path.push(prevVersion);
        build(path);
      }
    }
    return path;
  };
  var maxMigration = _.max(data.migrations, 'intVersion');
  if (maxMigration.version === data.version) {
    log.info('Database version is actual (' + data.version + ')');
    return cb(null, []);
  }
  var currentVersion = getVersionInt(data.version);
  if (currentVersion > maxMigration.intVersion) {
    return cb(new Error('Current migration "' + data.version + '" heigher then you have "' + maxMigration.version + '".'));
  }
  log.info('Building migration path from current version (' + data.version + ') to latest (' + maxMigration.version + ')...');
  var path = build([maxMigration]).reverse();
  log.info('Migration path: ' + data.version + ' -> ' + _.pluck(path, 'version').join(' -> '));
  return cb(null, path);
}

exports.migrateToActual = function (data, path, next) {
  var log = logger();

  async.auto({
    'version': getVersion,
    'migrations': _.partial(getMigrations, path),
    'build': ['version', 'migrations', function(next, data) {
      log.info('Build');
      buildMigrationPath(next, data);
    }],
    'migrate': ['build', function (next, data) {
      async.eachSeries(data.build, function (item, nxt) {
        log.info('Migration to version', item.version, 'started...');
        item.migrate(data, function (err) {
          if (err) { return nxt(err); }

          version.create({version: item.version}, nxt);
          log.info('Migration to version', item.version, 'successfully complete');
        });
      }, next);
    }]
  }, next);
};
