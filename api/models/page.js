'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  url: {type: String, required: true},

  site: {
    _id: mongoose.Schema.Types.ObjectId,
  },

  removed: {type: Date},
  createDate: {type: Date, required: true, default: Date.now}
}, {
  strict: true,
  safe: true,
  collection: 'pages'
});

schema.index({ url: 1, 'site._id': 1 }, { unique: true });

schema.statics.ensureExists = function (url, site, cb) {
  var match = { url: url, 'site._id': site._id},
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

module.exports = mongoose.model('Page', schema);
