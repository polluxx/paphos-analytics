'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  siteUrl: {type: String, required: true},
  token: {type: String, required: true},
  siteId: mongoose.Schema.Types.ObjectId,
  removed: {type: Date},
  createDate: {type: Date, required: true, default: Date.now}
}, {
  strict: true,
  safe: true,
  collection: 'tempSites'
});

schema.index({ siteUrl: 1, siteId: 1 }, { unique: true });

module.exports = mongoose.model('TempSite', schema);
