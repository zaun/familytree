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
        if (!_.find(requestSize, opts)) {
          fs.exists(fileOrig, function (origExists) {
            if (origExists) {
              winston.info('Requesting thumbnail ' + fileOrig);
              requestSize.push(opts);
              setTimeout(sendThumbInternal, 250);
            } else {
              res.status(404).end();
            }
          });
        } else {
          setTimeout(sendThumbInternal, 250);
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

  var sendThumbInternal = function () {
    fs.exists(fileImage, function (thumbExists) {
      if (thumbExists) {
        var readStream = fs.createReadStream(fileImage);
        readStream.pipe(base64.encode()).pipe(res);
      } else {
        var opts = {
          src: fileOrig,
          dst: fileImage,
          width: 1200
        };
        if (!_.find(requestSize, opts)) {
          fs.exists(fileOrig, function (origExists) {
            if (origExists) {
              winston.info('Requesting image ' + fileOrig);
              requestSize.push(opts);
              setTimeout(sendThumbInternal, 250);
            } else {
              res.status(404).end();
            }
          });
        } else {
          setTimeout(sendThumbInternal, 250);
        }
      }
    });
  };
  sendThumbInternal();
};


var currentOptions = null;
var processResizes = function () {
  if (requestSize.length > 0 && currentOptions === null) {
    currentOptions = requestSize[0];
    winston.info('Processing image resize:' + currentOptions.src);

    thumb.open(currentOptions.src, function (openError, image) {
      if (openError) {
        winston.error('Image open error ' + openError);
        requestSize.shift();
        currentOptions = null;
        setTimeout(processResizes, 50);
        return;
      }
      winston.info('Image opened ' + currentOptions.src);

      image.batch()
        .resize(currentOptions.width, 'lanczos')
        .writeFile(currentOptions.dst, function (saveError) {
          if (saveError) {
            winston.error('Image save error ' + saveError);
          } else {
            winston.info('Image saved ' + currentOptions.dst);
          }
          requestSize.shift();
          currentOptions = null;
          setTimeout(processResizes, 50);
        });
    });
  } else {
    setTimeout(processResizes, 50);
  }
};

exports.initialize = function (app) {
  DATA_DIR = app.treeDir;
  app.get('/api/thumb/:name', auth.secureRoute, sendThumb);
  app.get('/api/image/:name', auth.secureRoute, sendImage);
  setTimeout(processResizes, 1000);
};
