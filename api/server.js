var express = require('express'),
  http = require('http'),
  path = require('path'),
  mongoose = require('mongoose'),
  async = require('async'),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  config = require('./config.js'),
  routes = require('./routes'),
  paphos = require('./lib/paphos'),
  GoogleService = require('./services/google.js'),
  WebmastersService = require('./services/webmasters.js'),
  AnalyticsService = require('./services/analytics.js');

var app = {
  log: paphos.log(config),
  config: config,
  models: {
    sites: require('./models/site.js'),
    pages: require('./models/page.js'),
    queries: require('./models/query.js'),
    statistics: require('./models/statistic.js'),
    visitStatistics: require('./models/visitStatistic.js')
  }
};

app.services = {
  tasks: new paphos.tasks(app, {
    plugins: path.join(__dirname, 'tasks'),
    host: config.get('tasks.stomp.host'),
    port: config.get('tasks.stomp.port'),
    login: config.get('tasks.stomp.login'),
    password: config.get('tasks.stomp.password'),
    destination: config.get('tasks.stomp.destination')
  }),

  google: googleSevice = new GoogleService(config.get('google.api')),
  webmasters: new WebmastersService(app, googleSevice),
  analytics: new AnalyticsService(app, googleSevice)
};

exports.app = app;

exports.init = function (next) {
  var startDate = Date.now();
  app.log.debug('Initializing', config.get('env'), 'configuration...');

  async.auto({
    'mongoose': function (next) {
      app.log.debug('Connecting to mongodb...');
      mongoose.connect(config.get('mongo.db'), function () {
        app.log.debug('Connected to mongodb successfully');
        next();
      });
      mongoose.connection.on('error', function (err) {
        app.log.error(err);
        next(err);
      });
      mongoose.set('debug', false);
    },
    'migration': ['mongoose', function (next) {
      app.log.info('Load migrations:', path.join(__dirname, 'migrations'));
      paphos.migrations.migrateToActual(app, path.join(__dirname, 'migrations'), next);
    }],
    'tasks': function(next) {
      if (!config.get('tasks.enabled')) {
        app.log.info('Tasks processing disabled');
        return next();
      }
      app.services.tasks.init(next);
    },
    'google': function(next) {
      app.services.google.init(next);
    }
  }, function (err) {
    if (err) { return next(err); }

    app.log.info('Configuration "' + config.get('env') + '" successfully loaded in', Date.now() - startDate, 'ms');
    next();
  });
};

exports.start = function (next) {
  async.auto({
    'tasks': function(next) {
      if (!config.get('tasks.enabled')) {
        app.log.info('Tasks processing disabled, skipping queue subscribing');
        return next();
      }
      app.services.tasks.start(next);
    },
    'google': function(next) {
      app.services.google.start(next);
    },
    'server': function(next) {
      app.server = express();
      app.httpServer = http.createServer(app.server);

      var corsOptionsDelegate = function(req, callback){
        var corsOptions = {};
        corsOptions.origin = true;
        corsOptions.credentials = true;
        corsOptions.exposedHeaders = ['x-total-count'];
        callback(null, corsOptions);
      };
      app.server.use(cors(corsOptionsDelegate));
      app.server.use(bodyParser.json({ limit: '50mb' }));
      app.server.use(function (req, res, next) {
        req.app = app;
        next();
      });

      app.log.debug('Http server starting at', config.get('http.port'), '...');

      routes.init(app);

      app.httpServer.listen(config.get('http.port'), next);
    }
  }, next);
};


exports.stop = function (cb) {
  async.auto({
    'mongoose': function(next){
      app.log.debug('Closing mongodb connection...');
      mongoose.connection.close(function (err) {
        if (err) { return next(err); }
        app.log.debug('Mongodb connection successfully closed');
        next();
      });
    },
    'tasks': function(next){
      if (!config.get('tasks.enabled')) {
        return next();
      }
      app.log.debug('Unsubscribe tasks manager');
      app.services.tasks.stop(next);
    },
    'server': function(next){
      if (!app.httpServer) { return next(); }
      app.log.debug('Stopping http server...');

      app.httpServer.close(function (err) {
        if (err) { return next(err);}
        app.log.debug('Http server stopped successfully');
        app.httpServer = null;
        next();
      });
    }
  }, cb);
};

process.on('uncaughtException', function (err) {
  app.log.error({err: err}, 'Caught exception: ' + err.toString());
  setTimeout(function () {
    process.exit(1);
  }, 500);
});
