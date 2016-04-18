'use strict';

var mongoose = require('mongoose');

var schema = new mongoose.Schema({
  title: {type: String, required: true},

  variableParameterName: {type: String, required: true},

  trackingParameterName: {type: String, required: true},

  trackingTime: String,

  removed: {type: Date},
  createDate: {type: Date, required: true, default: Date.now}
}, {
  strict: true,
  safe: true,
  collection: 'experiments'
});

schema.index({ title: 1 }, { unique: true });

module.exports = mongoose.model('Experiment', schema);
