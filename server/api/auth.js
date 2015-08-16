'use strict';

var PersonModel = require('../models/person'),
      UserModel = require('../models/user'),
          async = require('async'),
         Bcrypt = require('bcrypt'),
            jwt = require('jsonwebtoken'),
         moment = require('moment');

var jwtSecret = 'BoogersR#1!';
var SALT_WORK_FACTOR = 10;

var isActive = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  async.waterfall([
    function (nextStep) {
      PersonModel.find({treeId: treeId}, '-parents -children -events', function (err, person) {
        nextStep(err, person.length > 0 ? true : false);
      });
    },
    function (active, nextStep) {
      UserModel.find({treeId: treeId}, function (err, user) {
        nextStep(err, active && (user.length > 0 ? true : false));
      });
    }
  ], function (err, active) {
    if (err) {
      res.json({ success: false, message: err.message ? err.message : err });
      return;
    }
    res.json({ success: true, active: active });
    return;
  });
};

var authenticateUser = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  async.waterfall([
    function (nextStep) {
      UserModel.findOne({
        treeId: treeId,
        username: req.body.username
      }, nextStep);
    },
    function (user, nextStep) {
      if (!user) {
        nextStep('Authentication failed. User not found.');
        return;
      }
      Bcrypt.compare(req.body.password, user.hash, function (err, isMatch) {
        nextStep(err, user, isMatch);
      });
    },
    function (user, isMatch, nextStep) {
      if (!isMatch) {
        nextStep('Authentication failed. Wrong password.');
        return;
      }

      // if user is found and password is right
      // create a token
      var token = jwt.sign(user, jwtSecret, {
        expiresInMinutes: 1440 // expires in 24 hours
      });
      nextStep(null, user.admin, token);
    }
  ], function (err, isAdmin, token) {
    if (err) {
      res.json({ success: false, message: err.message ? err.message : err });
      return;
    }
    res.json({
      success: true,
      isAdmin: isAdmin,
      token: token
    });
  });
};

var userAdd = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  async.waterfall([
    function (nextStep) {
      UserModel.findOne({
        treeId: treeId,
        username: req.body.username
      }, nextStep);
    },
    function (user, nextStep) {
      if (user) {
        nextStep('User already exists.');
        return;
      }
      Bcrypt.genSalt(SALT_WORK_FACTOR, nextStep);
    },
    function (salt, nextStep) {
      Bcrypt.hash(req.body.password, salt, nextStep);
    },
    function (hash, nextStep) {
      PersonModel.find({treeId: treeId}, '-parents -children -events', function (err, people) {
        nextStep(err, hash, people.length <= 0);
      });
    },
    function (hash, newSite, nextStep) {
      UserModel.find({treeId: treeId}, function (err, people) {
        nextStep(err, hash, newSite || (people.length <= 0));
      });
    },
    function (hash, newSite, nextStep) {
      var user = new UserModel();
      user.treeId = treeId;
      user.name = req.body.name;
      user.username = req.body.username;
      user.hash = hash;
      user.admin = newSite;
      user.createdAt = moment().toISOString();
      user.updatedAt = moment().toISOString();
      user.save(nextStep);
    }
  ], function (err) {
    if (err) {
      res.json({ success: false, message: err.message ? err.message : err });
      return;
    }
    res.json({ success: true, message: '' });
  });
};

var userList = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  if (!req.user || !req.user.admin) {
    res.status(403).send({
      success: false,
      message: 'Go Away.'
    });
    return;
  }

  return UserModel.find({treeId: treeId}, function (err, users) {
    if (!err) {
      return res.send(users);
    } else {
      return console.log(err);
    }
  });
};

var verify = function (req, res) {
  res.json({ success: true, message: 'Valid token.' });
};

var secureRoute = function (req, res, next) {
  var token = req.headers.authorization || req.headers['x-access-token'] || req.body.token || req.query.token || '';
  var parts = token.split(' ');
  if (parts.length === 2 && parts[0] === 'Bearer') {
    token = parts[1];
  }

  if (!token) {
    res.status(401).send({
      success: false,
      message: 'No token provided.'
    });
    return;
  }

  jwt.verify(token, jwtSecret, function (err, decoded) {
    if (err) {
      res.status(401).send({
        success: false,
        message: 'Failed to authenticate token.'
      });
      return;
    }

    // if everything is good, save to request for use in other routes
    req.user = decoded;
    next();
  });
};

exports.secureRoute = secureRoute;
exports.initialize = function (app) {
  app.get('/api/active', isActive);
  app.post('/api/auth', authenticateUser);
  app.post('/api/users', userAdd);
  app.get('/api/users', secureRoute, userList);
  app.get('/api/verify', secureRoute, verify);
};
