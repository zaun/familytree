'use strict';

var FamilyModel = require('../models/family'),
           auth = require('../api/auth');

var familyList = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  return FamilyModel.find({treeId: treeId}, function (err, people) {
    if (!err) {
      return res.send(people);
    } else {
      return console.log(err);
    }
  });
};

var familyGet = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  return FamilyModel.findOne({treeId: treeId, gedId: req.params.id}, function (err, person) {
    if (!err) {
      return res.send(person);
    } else {
      return console.log(err);
    }
  });
};


exports.initialize = function (app) {
  app.get('/api/families', auth.secureRoute, familyList);
  app.get('/api/families/:id', auth.secureRoute, familyGet);
};
