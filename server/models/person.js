'use strict';

var mongoose = require('mongoose');
var schema = require('./schema/person');

var Person = mongoose.model('Person', schema);

module.exports = Person;