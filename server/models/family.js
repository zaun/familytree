'use strict';

var mongoose = require('mongoose');
var schema = require('./schema/family');

var Family = mongoose.model('Family', schema);

module.exports = Family;