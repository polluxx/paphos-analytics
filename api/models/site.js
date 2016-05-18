'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  siteUrl: {type: String, required: true},

  isActive: Boolean,
  services: {
    analytics: Boolean,
    yandex: Boolean,
    webmaster: Boolean
  },

  tokens: {
    access_token: String,
    refresh_token: String,
    token_type: String,
    id_token: String,
    expiry_date: Number
  },

  yandexTokens: {
    token: String,
    expires: Date
  },

  analytics: {
    webPropertyId: String,
    profileId: String
  },

  removed: {type: Date},
  createDate: {type: Date, required: true, default: Date.now}
}, {
  strict: true,
  safe: true,
  collection: 'sites'
});

schema.index({ siteUrl: 1 }, { unique: true });

module.exports = mongoose.model('Site', schema);
