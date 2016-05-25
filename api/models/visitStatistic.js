'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  site: {
    _id: mongoose.Schema.Types.ObjectId
  },
  page: {
    _id: mongoose.Schema.Types.ObjectId,
    url: String
  },
  date: { type: Date, required: true },

  sessions: Number,
  pageviews: Number
}, {
  versionKey: false,

  strict: true,
  safe: true,
  collection: 'visitStatistics'
});

schema.index({ 'site._id': 1, date: 1 });
schema.index({ 'page._id': 1, 'site._id': 1, date: 1 });
//schema.index({ siteUrl: 1 }, { unique: true });

schema.statics.ensureExists = function (page, site, date, cb) {
  var match = { 'page._id': page._id, 'site._id': site._id, date: date },
    model = this;

  this.findOne(match, function(err, item) {
    if (err) { return cb(err); }
    if (item) {
      return cb(null, item);
    }
    item = new model({ 'page': page, site: site, date: date });
    item.save(function(err) {
      if (err) { return cb(err); }
      cb(null, item);
    });
  })
}

module.exports = mongoose.model('visitStatistic', schema);
