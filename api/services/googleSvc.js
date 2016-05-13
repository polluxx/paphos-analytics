'use strict';

var async = require('async'),
  request = require('request'),
  cheerio = require('cheerio'),
  _ = require('lodash');

function GoogleSvc(app) {
  this.app = app;
}

GoogleSvc.prototype.getSitesByKeyword = function (keyword, options, next) {

  options.count = options.count || 10;

  request('http://www.google.ru/search?num=' + options.count + '&complete=0&q=' + keyword, function (error, response, body) {
    if (error) { return next(error); }

    var urls = [],
      pushUrl,
      regex =  /url\?q=(\S+)&sa=/,
      $ = cheerio.load(body);

    $('h3.r a').each(function() {
      var url = $(this).attr("href").match(regex);

      if(url) {
        pushUrl = url[1];
        if(options.regex !== undefined) {
          var domain = url[1].match(options.regex);
          pushUrl = domain !== undefined ? domain[0] : url[1];
        }
        console.log(pushUrl);
        urls.push(pushUrl);
      }
    });

    next(null, urls);
  });

};

GoogleSvc.prototype.getUrlPosition = function (url, keyword, options, next) {
  this.getSitesByKeyword(keyword, options, function(err, urls) {
    //if (err || !urls.length) { return next(err || 'No urls provided. This may be caused by Google CAPTCHA.'); }
    if (err) { return next(err); }
    next(null, _.indexOf(urls, url) + 1);
  });
};

module.exports = GoogleSvc;