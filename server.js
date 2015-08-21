'use strict';

var        express = require('express'),
              http = require('http'),
          mongoose = require('mongoose'),
           multer  = require('multer'),
              path = require('path'),
            rimraf = require('rimraf'),
        requireDir = require('require-dir'),
           winston = require('winston'),
                 _ = require('lodash');

_.str = require('underscore.string');
_.mixin(_.str.exports());

var port = process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || 3000;
var ip   = process.env.IP   || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0';

// var domain = 'server.com';
var maxUpload = '500mb';

// Setup applicaiton
var app = express();
app.env = process.env.NODE_ENV || 'development';
app.tempDir = (process.env.OPENSHIFT_DATA_DIR || __dirname) + '/temp';
app.logDir = (process.env.OPENSHIFT_DATA_DIR || __dirname) + '/log';
app.treeDir = (process.env.OPENSHIFT_DATA_DIR || __dirname) + '/tree-files/';

// Remove console logging if we aren't on a development server
if (app.env === 'production') {
  winston.remove(winston.transports.Console);
} else {
  winston.remove(winston.transports.Console);
  winston.add(winston.transports.Console, {
    level: 'info',
    colorize: true,
    prettyPrint: true
  });
}

// Add file logging
winston.add(winston.transports.File, { filename: app.logDir + '/app.log' });

mongoose.connect(process.env.OPENSHIFT_MONGODB_DB_URL || process.env.MONGO_URL);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('mongo opened');
});

// CORS
app.use(function (req, res, next) {
  var ALLOWED_HEADERS = [
    'Accept',
    'Accept-Encoding',
    'Accept-Version',
    'Allow',
    'Authorization',
    'Cache-Control',
    'Content-Type',
    'Origin',
    'Pragma',
    'Set-Cookie',
    'X-Prototype-Version',
    'X-Requested-With'
  ];

  // var originRegex;
  // if (app.app === 'development') {
  //   originRegex = /^.*/;
  // } else {
  //   originRegex = new RegExp('/^https?:\\/\\/(www.)?' + domain + '/');
  // }

  // if (req.headers.origin && req.headers.origin.match(originRegex)) {
  //   res.header('Access-Control-Allow-Origin', req.headers.origin);
  //   res.header('Access-Control-Allow-Credentials', 'true');
  //   res.header('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
  //   res.header('Access-Control-Allow-Headers', ALLOWED_HEADERS.join(','));
  //   res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
  // }

  if (req.method === 'OPTIONS') {
    // check to make sure headers match
    if (req.headers['access-control-request-headers']) {
      var failed = false;
      _.each(req.headers['access-control-request-headers'].split(','), function (header) {
        header = _.trim(header);
        if (!_.any(ALLOWED_HEADERS, function (h) { return h.toLowerCase() === header; })) {
          failed = true;
        }
      });
      if (failed) {
        res.status(406).send();
        return;
      }
    }
    res.status(200).send();
    return;
  }

  // don't frame me
  res.header('X-Frame-Options', 'DENY');
  next();
});

// If behind an LB, enforce https
// app.use(function (req, res, next) {
//   if (req.get('X-Forwarded-Proto') && req.get('X-Forwarded-Proto') !== 'https') {
//     res.redirect('https://' + req.get('Host') + req.url);
//   } else {
//     next();
//   }
// });

// Remove old temp files
rimraf.sync(app.tempDir);

// Setup middlewares
app.use(require('body-parser').urlencoded({ extended: true, limit: maxUpload }));
app.use(require('body-parser').json({limit: maxUpload}));
app.use(multer({
  dest: app.tempDir,
  rename: function (fieldname, filename) {
    return filename.replace(/\W+/g, '-').toLowerCase() + Date.now();
  }
}));

app.use(express.static(path.join(__dirname, 'build/static')));

// Hookup the api handlers
var handlers = requireDir('./server/api', {recurse: true});
_.each(_.keys(handlers), function (handler) {
  if (handlers[handler].initialize) {
    handlers[handler].initialize(app);
  }
});

// Run the server
var server = http.createServer(app);

server.listen(port, ip, function () {
  winston.info('Server running on ' + ip + ':' + port);
});
