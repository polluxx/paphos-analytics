'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  url: {type: String, required: true},
  searchPage: {type: Number},
  title: {type: String},
  siteId: mongoose.Schema.Types.ObjectId,
  keywords: {type: Array},
  pageviews: {type: Number},

  removed: {type: Date},
  createDate: {type: Date, required: true, default: Date.now}
}, {
  strict: true,
  safe: true,
  collection: 'pages'
});

schema.index({ url: 1, 'siteId': 1 }, { unique: true });

schema.statics.ensureExists = function (url, site, cb) {
  var match = { url: url, 'siteId': site._id},
    model = this;

  this.findOne(match, function(err, item) {
    if (err) { return cb(err); }
    if (item) {
      return cb(null, item);
    }
    item = new model({ url: url, site: site });
    item.save(function(err) {
      if (err) { return cb(err); }
      cb(null, item);
    });
  })
}

schema.statics.findAndModify = function (query, sort, doc, options, callback) {
  return this.collection.findAndModify(query, sort, doc, options, callback);
};

module.exports = mongoose.model('Page', schema);
