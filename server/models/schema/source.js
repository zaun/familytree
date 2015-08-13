'use strict';

// grab the things we need
var mongoose   = require('mongoose');
var basePerson = require(__dirname + '/basePerson');
var baseEvent  = require(__dirname + '/baseEvent');
var obj = require(__dirname + '/object');
var _ = require('lodash');
var Schema = mongoose.Schema;

var sourceSchema = new Schema({
  treeId: { type: String, required: true },
  gedId: { type: String, required: true },
  title: String,
  objects: [obj],
  people: [{
    person: _.cloneDeep(basePerson),
    page: String
  }],
  events: [{
    person: _.cloneDeep(basePerson),
    event: _.omit(baseEvent, 'sources'),
    page: String
  }],
  objectCount: Number,
  peopleCount: Number,
  eventCount: Number,
  type: String,
  reference: String
});

sourceSchema.index({ treeId: 1, gedId: 1}, { unique: true });

sourceSchema.pre('save', function (next) {
  this.peopleCount = this.people.length;
  this.eventCount = this.events.length;
  this.objectCount = this.objects.length;
  next();
});

module.exports = sourceSchema;