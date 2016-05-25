'use strict';

var YandexDirect = require('yandex-direct'),
  async = require('async'),
  querystring = require('querystring'),
  request = require('request');

function YandexWds(app) {
  this.app = app;

  this.config = app.config.get('yandex.api');
  // list of current live reports | yandex limits to 5 reports max for use
  this.reports = [];
  //this.deviceId = uuid.v4();
}

YandexWds.prototype.init = function(token, next) {
  this.api = YandexDirect({
    token: token, // required.
    locale: 'ru', // optional; default is 'en'.
    live: true, // optional; default is false.
    sandbox: true, // optional; default is false.
    version: 4 // optional; default is 4.
  });

  next(null, token);
}

YandexWds.prototype.authorize = function(app) {
  var config = app.config.get('yandex.api');

  var requestParams = {
    response_type: 'token',
    client_id: config.clientId
    //device_id: this.deviceId
  };

  request(config.auth, requestParams, (error, response) => {
    if(error) {
      console.error(error);
      return;
    }

    console.log(response);
  });
}

YandexWds.prototype.createWordstatReport = function(phrases, token, next) {

  var reqParams = {
    "method": "CreateNewWordstatReport",
    "Phrases": phrases,
    "locale": "ru",
    "token": token
  };

  // Request with params.
  this.api.call('CreateNewWordstatReport', reqParams, (error, response) => {
    if(error) return next(error);

    this.reports.push(response);
    next(null, response)
  });
}

YandexWds.prototype.deleteWordstatReport = function(id, next) {
  this.api.call('DeleteWordstatReport', id, (error, response) => {
    if(error) return next(error);

    console.log('DeleteWordstatReport', response);
    if(response !== 1) return next('Error when removing report ID: ' + id);

    this.reports.splice(this.reports.indexOf(id), 1);
    next(null, 'OK');
  });
}

YandexWds.prototype.listWordstatReports = function(next) {
  this.api.call('GetWordstatReportList', next);
}

YandexWds.prototype.getWordstatReport = function(id, next) {
  this.api.call('GetWordstatReport', id, next);
}

YandexWds.prototype.getAuthCode = function(next, isRequest) {
  var config = this.config;
  var requestParams = {
    response_type: 'code',
    client_id: config.clientId,
    force_confirm: true
  };
  var requestUrl = config.auth + "?" + querystring.stringify(requestParams);
  next(null, requestUrl);
}

YandexWds.prototype.getToken = function(code, next) {
  var config = this.config;
  var requestParams = {
    grant_type: 'authorization_code',
    code: code,
    client_id: config.clientId,
    client_secret: config.secret
  };
  request.post({url:'https://oauth.yandex.com/token', form: requestParams}, function(error, response, body) {
    if(error || response.statusCode !== 200) return next(error || 'status of response: '+response.statusCode);
    next(null, body);
  });
}

YandexWds.prototype.syncAccount = function(token, next) {
  var self = this, tokenRes = JSON.parse(token);
  console.log('start', token);


  self.app.models.sites.find({}, function (error, sites) {
    if(error) return next(error);

    async.each(sites, function (site, next) {
      site.services.yandex = true;
      site.yandexTokens.token = tokenRes.access_token;
      site.yandexTokens.expires = tokenRes.expires_in;
      site.save(next);
    }, next);
  });

  next();
}

module.exports = YandexWds;