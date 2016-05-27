'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  date: { type: Date, required: true },

  removed: {type: Date},
  createDate: {type: Date, required: true, default: Date.now}
}, {
  strict: true,
  safe: true,
  collection: 'yandexUpdates'
});

schema.index({ date: 1 });
module.exports = mongoose.model('YandexUpdate', schema);
