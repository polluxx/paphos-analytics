'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  site: {
    _id: mongoose.Schema.Types.ObjectId,
  },
  page: {
    _id: mongoose.Schema.Types.ObjectId,
    url: String
  },
  query: {
    _id: mongoose.Schema.Types.ObjectId,
    keyword: String
  },
  date: { type: Date, required: true },

  country: String,
  device: String,
  clicks: Number,
  impressions: Number,
  ctr: Number,
  position: Number,

  removed: {type: Date},
  createDate: {type: Date, required: true, default: Date.now}
}, {
  strict: true,
  safe: true,
  collection: 'statistics'
});

schema.index({ 'site._id': 1, date: 1 });
schema.index({ 'page._id': 1, 'query._id': 1, date: 1 });
//schema.index({ siteUrl: 1 }, { unique: true });

schema.statics.ensureExists = function (page, query, site, date, cb) {
  var match = { 'page._id': page._id, 'query._id': query._id, 'site._id': site._id, date: date },
    model = this;

  this.findOne(match, function(err, item) {
    if (err) { return cb(err); }
    if (item) {
      return cb(null, item);
    }
    item = new model({ 'page': page, 'query': query, site: site, date: date });
    item.save(function(err) {
      if (err) { return cb(err); }
      cb(null, item);
    });
  })
}

module.exports = mongoose.model('Statistic', schema);
