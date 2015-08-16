'use strict';

var base64 = require('base64-stream'),
        fs = require('fs'),
      auth = require('../api/auth'),
 thumbnail = require('easyimage');

var sendThumb = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  var fileThumb = __dirname + '/../../tree-files/' + treeId + '/thumbs/' + req.params.name;
  var fileOrig = __dirname + '/../../tree-files/' + treeId + '/media/' + req.params.name;
  fs.exists(fileThumb, function (thumbExists) {
    if (thumbExists) {
      var readStream = fs.createReadStream(fileThumb);
      readStream.pipe(base64.encode()).pipe(res);
    } else {
      fs.exists(fileOrig, function (origExists) {
        if (origExists) {
          thumbnail.resize({
            src: fileOrig,
            dst: fileThumb,
            width: 200
          }).then(function () {
            var readStream = fs.createReadStream(fileThumb);
            readStream.pipe(base64.encode()).pipe(res);
          }, function (err) {
            console.log(err);
            res.status(500).send(err.message);
          });
        } else {
          res.status(404).end();
        }
      });
    }
  });
};

var sendImage = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  var fileImage = __dirname + '/../../tree-files/' + treeId + '/normal/' + req.params.name;
  var fileOrig = __dirname + '/../../tree-files/' + treeId + '/media/' + req.params.name;
  fs.exists(fileImage, function (normalExists) {
    if (normalExists) {
      var readStream = fs.createReadStream(fileImage);
      readStream.pipe(base64.encode()).pipe(res);
    } else {
      fs.exists(fileOrig, function (origExists) {
        if (origExists) {
          thumbnail.resize({
            src: fileOrig,
            dst: fileImage,
            width: 1200
          }).then(function () {
            var readStream = fs.createReadStream(fileImage);
            readStream.pipe(base64.encode()).pipe(res);
          }, function (err) {
            console.log(err);
            res.status(500).send(err.message);
          });
        } else {
          res.status(404).end();
        }
      });
    }
  });
};


exports.initialize = function (app) {
  app.get('/api/thumb/:name', auth.secureRoute, sendThumb);
  app.get('/api/image/:name', auth.secureRoute, sendImage);
};