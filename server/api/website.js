'use strict';

var      fs = require('fs');

var indexRoute = function (req, res) {
  var index = fs.readFileSync('./build/static/html/index.html', {encoding: 'utf8'});
  res.status(200).send(index);
};

exports.initialize = function (app) {
  app.get('/', indexRoute);
};
