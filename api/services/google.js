var logger = require('../lib/paphos/log.js'),
  async = require('async'),
  google = require('googleapis'),
  OAuth2 = google.auth.OAuth2;

function GoogleService(options) {
  var log = this.log = logger().child({module: 'GoogleService'});
  this.options = options;
}

GoogleService.prototype.init = function (next) {
  next();
};
GoogleService.prototype.start = function (next) {
  next();
};
GoogleService.prototype.generateAuthUrl = function (next) {
  var scopes = [
    'https://www.googleapis.com/auth/plus.me',
    'https://www.googleapis.com/auth/webmasters.readonly',
    'https://www.googleapis.com/auth/webmasters',
    'https://www.googleapis.com/auth/analytics.edit',
    'https://www.googleapis.com/auth/analytics.readonly'
  ];

  var url = this.getClient({}).generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    approval_prompt: 'force'
  });

  next(null, url);
};

GoogleService.prototype.getClient = function (tokens) {
  var oauth2Client = this.client = new OAuth2(this.options['client-id'], this.options['secret'], this.options['redirectUrl']);
  google.options({ auth: oauth2Client });
  oauth2Client.setCredentials(tokens);
  return oauth2Client;
};
GoogleService.prototype.setCredentials = function (tokens) {
  return this.getClient(tokens);
};
GoogleService.prototype.refreshAccessToken = function (next) {
  this.client.refreshAccessToken(next);
};

GoogleService.prototype.getToken = function (code, next) {
  var client = this.client;

  client.getToken(code, function(err, tokens) {
    if (err) { return next(err); }

    client.setCredentials(tokens);
    next(null, tokens);
  });
};

GoogleService.prototype.webmasters = function() {
  return google.webmasters('v3');
};

GoogleService.prototype.analytics = function() {
  return google.analytics('v3');
};

module.exports = GoogleService;