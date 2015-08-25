'use strict';

var base64 = require('base64-stream'),
        fs = require('fs'),
      auth = require('../api/auth'),
 thumbnail = require('easyimage'),
     thumb = require('lwip'),
   winston = require('winston'),
         _ = require('lodash');

var DATA_DIR;
var requestSize = [];

var sendThumb = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  var fileThumb = DATA_DIR + '/' + treeId + '/thumbs/' + req.params.name;
  var fileOrig = DATA_DIR + '/' + treeId + '/media/' + req.params.name;

  var sendThumbInternal = function () {
    winston.info('Looking for thumbnail ' + fileThumb);
    fs.exists(fileThumb, function (thumbExists) {
      if (thumbExists) {
        var readStream = fs.createReadStream(fileThumb);
        readStream.pipe(base64.encode()).pipe(res);
      } else {
        var opts = {
          src: fileOrig,
          dst: fileThumb,
          width: 200
        };
        if (!_.contains(requestSize, opts)) {
          fs.exists(fileOrig, function (origExists) {
            if (origExists) {
              winston.info('Requesting thumbnail ' + fileOrig);
              requestSize.push(opts);
              setTimeout(sendThumbInternal, 1000);
            } else {
              res.status(404).end();
            }
          });
        } else {
          setTimeout(sendThumbInternal, 1000);
        }
      }
    });
  };
  sendThumbInternal();
};

var sendImage = function (req, res) {
  var treeId = req.get('host').replace(':', '-');

  var fileImage = DATA_DIR + '/' + treeId + '/normal/' + req.params.name;
  var fileOrig = DATA_DIR + '/' + treeId + '/media/' + req.params.name;
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


var processResizes = function () {
  if (requestSize.length > 0) {
    var options = requestSize.shift();
    winston.info('Processing image resize:' + options.src);

    thumb.open(options.src, function (openError, image) {
      if (openError) {
        winston.info('Thumbnail open error ' + openError);
        return;
      }

      image.batch()
            .resize(options.width, null, 'lanczos')
            .writeFile(options.dst, function (saveError) {
              if (saveError) {
                winston.info('Thumbnail save error ' + saveError);
              }
            });
    });

    thumbnail.resize(options).then(function () {
      setTimeout(processResizes, 500);
    }, function (err) {
      winston.info('Thumbnail error ' + err + ' - ' + options.src);
      setTimeout(processResizes, 500);
    });
  } else {
    setTimeout(processResizes, 500);
  }
};

exports.initialize = function (app) {
  DATA_DIR = app.treeDir;
  app.get('/api/thumb/:name', auth.secureRoute, sendThumb);
  app.get('/api/image/:name', auth.secureRoute, sendImage);
  setTimeout(processResizes, 1000);
};
