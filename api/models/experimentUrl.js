'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({

  experimentId: mongoose.Schema.Types.ObjectId,

  projectId: mongoose.Schema.Types.ObjectId,

  url: {type: String, required: true},

  oldValue: {type: String, required: true},

  newValue: {type: String, required: true},

  period: {
    startDate: Date,
    endDate: Date
  },

  removed: {type: Date},
  createDate: {type: Date, required: true, default: Date.now}
}, {
  strict: true,
  safe: true,
  collection: 'experimentUrls'
});

schema.index({ projectId: 1, url: 1 }, { unique: true });

module.exports = mongoose.model('ExperimentUrl', schema);
