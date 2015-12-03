var plugable = require('./plugable.js'),
  logger = require('./log.js'),
  async = require('async'),
  stompit = require('stompit');

function TasksService(app, options) {
  this.options = options;

  var log = this.log = logger().child({module: 'TasksService'});
  this.app = app;
  this.plugins = {};
  this.client = null;
  this.messagesInProcess = 0;

  var self = this;
  this.subscriptionHandler = function (body) {
    var message = JSON.parse(body);
    log.debug('Tasks message "%s"', message.body.name);

    self.messagesInProcess += 1;
    var startAt = process.hrtime();
    self.processMessage(message, function (err) {
      self.messagesInProcess -= 1;
      if (err) {
        return log.error(err, err.toString());
      }
    });
  };
}

TasksService.prototype.processMessage = function (message, next) {
  var self = this;
  var handlers = self.plugins[message.body.name];
  if (Array.isArray(handlers) && handlers.length > 0) {
    async.each(handlers, function (handler, next) {
      if (handler.length > 3) {
        handler({log: self.log.child({taskName: message.body.name})}, self.app, message, next);
      } else {
        handler(self.app, message, next);
      }
    }, function (err) {
      if (err) {
        return next(err);
      }
      self.log.debug('Event "%s" processed successfully. Executed tasks - %s', message.body.name, handlers.length);
      next();
    });
  } else {
    self.log.debug('Event "%s" processed successfully without executing tasks', message.body.name);
    next();
  }
};


TasksService.prototype.init = function (next) {
  var self = this;

  self.connectionManager = new stompit.ConnectFailover([
    {
      host: self.options.host,
      port: self.options.port,
      resetDisconnect: true,
      connectHeaders: {
        host: '/',
        login: self.options.login,
        passcode: self.options.password,
        'heart-beat': '1000,1000'
      }
    }
  ]);

  self.connectionManager.on('error', function (error) {
    var connectArgs = error.connectArgs;
    var address = connectArgs.host + ':' + connectArgs.port;
    self.log.error('Could not connect to tasks stomp ' + address + ': ' + error.message);
  });

  /*self.connectionManager.on('connecting', function (connector) {
    self.log.debug('Connecting to tasks stomp ' + connector.serverProperties.remoteAddress.transportPath);
  });*/

  this.log.info('Loading tasks plugins started...');
  plugable.getPlugins(this.options.plugins, function (err, list) {
    if (err) {
      return next(err);
    }
    self.plugins = list;

    var pluginsCount = Object.keys(self.plugins).length;
    if (pluginsCount === 0) {
      self.log.warn('Tasks plugins loading procedure complete successfully, but plugins not found');
    } else {
      self.log.info('Tasks plugins loaded successfully - %s', pluginsCount);
    }
    next(null, list);
  })
};


TasksService.prototype.start = function (next) {
  var self = this,
    destination = self.options.destination;

  self.log.info('Subscribing to tasks queue "%s"', destination);

  var subscribeHeaders = {'destination': destination, 'ack': 'auto'};

  self.channelPool = stompit.ChannelPool(self.connectionManager);

  self.log.debug('Subscribe to destination "%s"', destination);
  self.channelPool.channel(function (err, channel) {
    if (err) {
      return self.log.error('Channel error', err.message);
    }
    self.channel = channel;
    channel.subscribe(subscribeHeaders, function (err, message, subscription) {
      if (err) {
        return self.log.error('Subscribe error', err.message);
      }
      self.subscription = subscription;
      message.readString('utf-8', function (err, body) {
        if (err) {
          return self.log.error('Message read error', err.message);
        }
        message.ack();
        self.subscriptionHandler(body);
      });
    });
    next();
  });
};

TasksService.prototype.stop = function (next) {
  this.channel.close();
  this.channelPool.close();
  next();
};

TasksService.prototype.push = function (body, next) {
  var self = this,
    destination = self.options.destination;

  self.channelPool.channel(function (err, channel) {
    if (err) {
      self.log.error('Send-channel error: ' + err.message);
    }
    var sendHeaders = {
      'destination': destination,
      'content-type': 'application/json'
    };
    channel.send(sendHeaders, JSON.stringify({body: body}), function (err) {
      if (err) {
        return (typeof next === 'function') ? next(err) : self.log.error('Send-channel error: ' + err.message);
      }
      if (typeof next === 'function') {
        next();
      }
    });
  });
};

TasksService.prototype.publish = function (taskName, body, next) {
  body = body || {};
  body.name = taskName;
  this.push(body, next);
};

module.exports = TasksService;