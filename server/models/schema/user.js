'use strict';

// grab the things we need
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  treeId: { type: String, required: true },
  name: String,
  username: { type: String, required: true },
  hash: { type: String, required: true },
  admin: Boolean,
  createdAt: String,
  updatedAt: String
});
userSchema.index({ treeId: 1, username: 1}, { unique: true });

module.exports = userSchema;