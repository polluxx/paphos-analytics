'use strict';

var async = require('async'),
  fs = require('fs'),
  path = require('path'),
  moment = require('moment'),
  _ = require('lodash');

exports.getInfo = function () {
  return ['0.0.2'];
};

function syncUpdates(app, cb) {
  fs.readFile(path.join(__dirname, 'json', 'yandexUpdates.json'), function (err, text) {
    if (err) { return cb(err); }

    var records = JSON.parse(text), date;
    console.info("Start migrating "+records.length+" records");
    async.each(records, function (update, next) {
      date = moment(update, 'DD.MM.YYYY');
      app.models.yandexUpdates.update({date: date}, {date: date}, {
        upsert: true,
        multi: false
      }, next);
    }, cb);
  });
}

exports.migrate = function (app, cb) {
  console.log('Migrating...');
  async.auto({
    yandexUpd: _.partial(syncUpdates, app)
  }, cb);
};