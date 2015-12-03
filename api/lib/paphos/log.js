'use strict';

var bunyan = require('bunyan'),
  PrettyStream = require('bunyan-prettystream');

var prettyStdOut = new PrettyStream();
prettyStdOut.pipe(process.stdout);

var writer = {
  write: function (obj) {
    var logRecord = {
      msg: obj.msg,
      level: obj.level,
      name: obj.name,
      pid: obj.pid,
      req: obj.req,
      hostname: obj.hostname
    };
    if (obj.account) {
      logRecord.account = {_id: obj.account._id, login: obj.account.login};
    }
    if (obj.refs && obj.refs.length > 0) {
      logRecord.refs = obj.refs;
    }
    models.logRecords.create(logRecord, function (err) {
      if (err && err.message !== 'Connection Closed By Application') {
        return console.error(err);
      }
    });
  }
};

var log;

module.exports = function(config) {
  if (log) {
    return log;
  }

  var streams = [];
  /*
   if (config.get('log.mongodb.enabled')) {
   streams.push({
   type: 'raw',
   level: config.get('log.mongodb.level'),
   stream: writer
   });
   }
   */
  if (config.get('log.stdout.enabled')) {
    streams.push({
      level: config.get('log.stdout.level'),
      type: 'raw',
      stream: prettyStdOut
    });
  }

  if (config.get('log.file.enabled')) {
    streams.push({
      level: config.get('log.file.level'),
      type: 'rotating-file',
      path: config.get('log.file.path'),
      period: '1d',
      count: 3
    });
  }

  if (config.get('log.syslog.enabled')) {
    try {
      if (require.resolve('node-syslog')) {
        var Syslog = require('node-syslog');
        Syslog.init('paphos-analytics', Syslog.LOG_PID | Syslog.LOG_ODELAY, Syslog.LOG_LOCAL0);
        var writer = {
          write: function (obj) {
            var level;

            if (obj.level <= 20) {
              level = Syslog.LOG_DEBUG;
            }
            else if (obj.level <= 30) {
              level = Syslog.LOG_INFO;
            }
            else if (obj.level <= 40) {
              level = Syslog.LOG_WARNING;
            }
            else if (obj.level <= 50) {
              level = Syslog.LOG_ERR;
            }
            else {
              level = Syslog.LOG_CRIT;
            }
            var msg = '@cee: ' + JSON.stringify(obj);
            Syslog.log(level, msg);
          }
        };
        streams.push({
          type: 'raw',
          level: config.get('log.syslog.level'),
          stream: writer
        });
      }
    } catch (e) {
      console.error('Syslog not found');
    }
  }
  log = bunyan.createLogger({
    name: 'paphos-analytics',
    level: 'debug',
    streams: streams
  });
  return log;
};