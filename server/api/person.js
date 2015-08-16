'use strict';

var PersonModel = require('../models/person'),
           auth = require('../api/auth');

var personList = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  return PersonModel.find({treeId: treeId}, '-parents -children -events', function (err, people) {
    if (!err) {
      return res.send(people);
    } else {
      return console.log(err);
    }
  });
};

var personGet = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  return PersonModel.findOne({treeId: treeId, gedId: req.params.id}, function (err, person) {
    if (!err) {
      return res.send(person);
    } else {
      return console.log(err);
    }
  });
};


exports.initialize = function (app) {
  app.get('/api/people', auth.secureRoute, personList);
  app.get('/api/people/:id', auth.secureRoute, personGet);
};
