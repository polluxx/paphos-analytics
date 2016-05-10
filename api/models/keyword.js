'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  word: {type: String, required: true},
  frequency: {type: Number},
  importance: {type: Number},
  siteId: mongoose.Schema.Types.ObjectId,
  positions: {type: Array},

  removed: {type: Date},
  createDate: {type: Date, required: true, default: Date.now},
  updated: {type:Date}
}, {
  strict: true,
  safe: true,
  collection: 'keywords'
});

schema.index({ word: 1, siteId: 1 }, { unique: true });

module.exports = mongoose.model('Keyword', schema);
