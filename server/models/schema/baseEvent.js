'use strict';

var baseSource = require(__dirname + '/baseSource');
var _ = require('lodash');

module.exports = {
  type: { type: String, required: true },
  date: Date,
  description: String,
  location: {
    name: String,
    lat: String,
    lon: String
  },
  sources: [_.cloneDeep(baseSource)]
};