'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  siteUrl: {type: String, required: true},
  tokens: {
    access_token: String,
    refresh_token: String,
    token_type: String,
    id_token: String,
    expiry_date: Number
  },
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
