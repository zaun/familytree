'use strict';

// grab the things we need
var mongoose   = require('mongoose');
var basePerson = require(__dirname + '/basePerson');
var baseSource = require(__dirname + '/baseSource');
var baseEvent  = require(__dirname + '/baseEvent');
var Schema = mongoose.Schema;
var _ = require('lodash');

var familySchema = new Schema({
  treeId: { type: String, required: true },
  gedId: { type: String, required: true },
  sources: [_.cloneDeep(baseSource)],
  partners: [_.cloneDeep(basePerson)],
  children: [_.cloneDeep(basePerson)],
  events: [_.cloneDeep(baseEvent)],
  isMarried: Boolean,
  isDivorced: Boolean,
  childrenCount: Number
});

familySchema.index({ treeId: 1, gedId: 1}, { unique: true });

familySchema.pre('save', function (next) {
  this.childrenCount = this.children.length;
  this.isMarried = _.find(this.events, { type: 'MARRIAGE'}) ? true : false;
  this.isDivorced = _.find(this.events, { type: 'DIVORCE'}) ? true : false;

  next();
});

module.exports = familySchema;