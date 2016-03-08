var fs      = require('fs'),
  async = require('async'),
  control = require('control');
var Client = require('ssh2').Client;

var execSsh = function(conn, cmd, next) {
  console.info('CMD: ' + cmd);
  conn.exec(cmd, function(err, stream) {
    if (err) throw err;
    stream.on('close', function(code, signal) {
      console.log('Stream :: close :: code: ' + code + ', signal: ' + signal);
      next();
    }).on('data', function(data) {
      console.log('STDOUT: ' + data);
    }).stderr.on('data', function(data) {
      console.log('STDERR: ' + data);
    });
  });
};

var Deployer = exports.Deployer = function(root, program) {
  this._parseConfiguration(root);
  this._parseCommandArguments(program);
  this._setupCallbacks(root);
  this._setupController();
  this._confirmSetup();
};

Deployer.prototype._parseConfiguration = function(root) {
  var config = {};

  try {
    var package_file = fs.readFileSync(root +'/package.json', 'utf8');
    config = JSON.parse(package_file);

    this.has_package_json = true;

    this.host = config.deployment.host;
    this.user = config.deployment.user;
    this.repo = config.deployment.repo;
    this.path = config.deployment.path;
    this.name = config.deployment.name;
  } catch(err) {
    this.has_package_json = false;
  }

  try {
    var config_file = fs.readFileSync(root +'/config/config.json', 'utf8');
    config = JSON.parse(config_file);

    this.has_config_json = true;

    this.host = config.deployment.host;
    this.user = config.deployment.user;
    this.repo = config.deployment.repo;
    this.path = config.deployment.path;
    this.name = config.deployment.name;
  } catch(err) {
    this.has_config_json = false;
  }
};

Deployer.prototype._parseCommandArguments = function(program) {
  if (program.host != undefined) { this.host = program.host }
  if (program.user != undefined) { this.user = program.user }
  if (program.repo != undefined) { this.repo = program.repo }
};

Deployer.prototype._setupCallbacks = function(root) {
  try {
    this.callbacks = require(root + '/config/deployer.js');
  } catch(err) {
    this.callbacks = {};
  }
};

Deployer.prototype._setupController = function() {
  this.controller = Object.create(control.controller);
  this.controller.user = this.user;
  this.controller.address = this.host;
  this.controller.sshOptions = ['-p 22104'];
};

Deployer.prototype._confirmSetup = function() {
  var setupConfirmed = true;

  if (this.host == undefined || this.host == '') {
    console.log('You must supply a deployment host in your configuration or via th -H option.');
    setupConfirmed = false;
  }

  if (this.user == undefined || this.user == '') {
    console.log('You must supply a deployment user in your configuration or via th -U option.');
    setupConfirmed = false;
  }

  if (this.repo == undefined || this.repo == '') {
    console.log('You must supply a deployment repo in your configuration or via th -R option.');
    setupConfirmed = false;
  }

  if (this.path == undefined || this.path == '') {
    console.log('You must supply a deployment path in your configuration.');
    setupConfirmed = false;
  }

  if (!setupConfirmed) { process.exit() }
};

Deployer.prototype._installDependencies = function() {
  if (this.has_package_json) { this.controller.ssh('npm install') }

  if (this.has_config_json && this.config_json.dependencies != undefined) {
    var dependencies = this.config_json.dependencies;

    for (key in dependencies) {
      var version = '';

      if (dependencies[key] != null || dependencies[key] != '' || dependencies[key] != undefined) {
        version = '@'+ dependencies[key];
      }

      this.controller.ssh('npm install '+ key + version);
    }
  }
};

Deployer.prototype.deploy = function() {
  var repo = this.repo;
  var name = this.name;
  var path = this.path + '/' + name;
  var controller = this.controller;
  var callbacks = this.callbacks;




    async.auto({
      'ssh' : function(next) {
        var conn = new Client();
        conn
          .on('ready', function() {
            next(null, conn);
          })
          .connect({
            host: 'micro.5stars.link',
            port: 22104,
            username: 'root',
            password: 'awdawd'
          });
      },
      'rm': ['ssh', function(next, res) {
        execSsh(res.ssh, 'rm -rf '+ path, next);
      }],
      'git': ['ssh', 'rm', function(next, res) {
        execSsh(res.ssh, 'git clone '+ repo +' '+ path, next);
      }],
      'npm': ['git', function(next, res) {
        execSsh(res.ssh, 'cd '+ path + '\nnpm install', next);
      }],
      'stop': ['npm', function(next, res) {
        execSsh(res.ssh, 'cd '+ path + '\nforever stop -a --uid "' + name + '" api/app.js', next);
      }],
      'start': ['stop', function(next, res) {
        execSsh(res.ssh, 'cd '+ path + '\nforever start -a --uid "' + name + '" api/app.js', next);
      }]
    }, function(err, res) {
      res.ssh.end();
    });
};