'use strict';

// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var objectSchema = new Schema({
  gedId: { type: String, required: true },
  file: String,
  title: String
});

module.exports = objectSchema;