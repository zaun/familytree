'use strict';


// grab the things we need
var mongoose   = require('mongoose');
var basePerson = require(__dirname + '/basePerson');
var baseSource = require(__dirname + '/baseSource');
var baseEvent  = require(__dirname + '/baseEvent');

var _ = require('lodash');

var Schema = mongoose.Schema;
var DEPTH = 2;


var person = _.cloneDeep(basePerson);
var temp = person;
for (var i = 0; i < DEPTH; i++) {
  temp.parents = [];
  temp.parents.push(_.cloneDeep(basePerson));
  temp = temp.parents[0];
}
temp = person;
for (i = 0; i < DEPTH; i++) {
  temp.children = [];
  temp.children.push(_.cloneDeep(basePerson));
  temp = temp.children[0];
}

var personSchema = new Schema(_.extend(person, {
  treeId: { type: String, required: true },
  events: [_.cloneDeep(baseEvent)],
  siblings: [_.cloneDeep(basePerson)],
  spouses: [_.extend(_.cloneDeep(basePerson), {
    marriage: {
      date: Date,
      name: String,
      lat: String,
      lon: String
    },
    divorce: {
      date: Date,
      name: String,
      lat: String,
      lon: String
    }
  })],
  childrenCount: Number,
  sources: [_.cloneDeep(baseSource)]
}));

personSchema.index({ treeId: 1, gedId: 1}, { unique: true });

personSchema.pre('save', function (next) {
  this.childrenCount = this.children.length;
  next();
});

module.exports = personSchema;