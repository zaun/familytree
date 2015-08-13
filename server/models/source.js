'use strict';

var mongoose = require('mongoose');
var schema = require('./schema/source');

var Source = mongoose.model('Source', schema);

module.exports = Source;