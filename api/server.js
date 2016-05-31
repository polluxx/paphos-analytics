var express = require('express'),
  http = require('http'),
  path = require('path'),
  mongoose = require('mongoose'),
  async = require('async'),
  cors = require('cors'),
  bodyParser = require('body-parser'),
  config = require('./config.js'),
  routes = require('./routes'),
  paphos = require('paphos-core'),
  GoogleService = require('./services/google.js'),
  WebmastersService = require('./services/webmasters.js'),
  AnalyticsService = require('./services/analytics.js'),
  YandexService = require('./services/yandex.js'),
  YandexWds = require('./services/yandexWds.js'),
  GoogleSvc = require('./services/googleSvc.js');

var app = {
  log: paphos.log(config),
  config: config,
  models: {
    sites: require('./models/site.js'),
    tempSites: require('./models/tempSite.js'),
    pages: require('./models/page.js'),
    keywords: require('./models/keyword.js'),
    queries: require('./models/query.js'),
    statistics: require('./models/statistic.js'),
    experiments: require('./models/experiment.js'),
    experimentUrls: require('./models/experimentUrl.js'),
    visitStatistics: require('./models/visitStatistic.js'),
    yandexUpdates: require('./models/yandexUpdates.js')
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

  data: googleSevice = new paphos.data(app, {
    dataDir: path.join(__dirname, 'data')
  }),

  google: googleSevice = new GoogleService(config.get('google.api'), config.get('url')),
  webmasters: new WebmastersService(app, googleSevice),
  analytics: new AnalyticsService(app, googleSevice),
  yandex: new YandexService(app),
  yandexWds: new YandexWds(app),
  googleSvc: new GoogleSvc(app)
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
    'migration': ['tasks', function (next) {
      //return next();
      app.log.info('Load migrations:', path.join(__dirname, 'migrations'));
      paphos.migrations.migrateToActual(mongoose, app, path.join(__dirname, 'migrations'), next);
    }],
    'google': function(next) {
      app.services.google.start(next);
    },
    'data': function(next) {
      app.services.data.loadData(next);
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


      app.server.use('/bower_components', express.static(path.join(__dirname, '../bower_components')));
      app.server.use('/app', express.static(path.join(__dirname, '../app')));
      app.server.use('/dist', express.static(path.join(__dirname, '../dist')));
      app.server.use('/assets', express.static(path.join(__dirname, '../assets')));
      app.server.use('/locale', express.static(path.join(__dirname, '../app/locale')));
      app.server.use('/views', express.static(path.join(__dirname, '../app/views')));

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
