'use strict';

var SourceModel = require('../models/source'),
           auth = require('../api/auth');

var sourceList = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  return SourceModel.find({treeId: treeId}, '-objects -people -events', function (err, people) {
    if (!err) {
      return res.send(people);
    } else {
      return console.log(err);
    }
  });
};

var sourceGet = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  return SourceModel.findOne({treeId: treeId, gedId: req.params.id}, function (err, person) {
    if (!err) {
      return res.send(person);
    } else {
      return console.log(err);
    }
  });
};


exports.initialize = function (app) {
  app.get('/api/sources', auth.secureRoute, sourceList);
  app.get('/api/sources/:id', auth.secureRoute, sourceGet);
};
