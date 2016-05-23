'use strict';

var async = require('async'),
  request = require('request'),
  cheerio = require('cheerio'),
  yandex = require('yandex-search'),
  xml2js = require('xml2js'),
  _ = require('lodash'),
  YandexDirect = require('yandex-direct');

function YandexSvc(app) {
  this.app = app;
}

YandexSvc.prototype.init = function(next) {
  next();
};

YandexSvc.prototype.getApiUrl = function (site) {
  return site.yandexXml;
};

YandexSvc.prototype.searchByKeyword = function (site, keyword, options, next) {
  var url = this.getApiUrl(site),
    self = this;
  
  yandex({url: url, query: keyword, groupby: {
    mode: 'deep',
    attr: 'd',
    groupsOnPage: options.count || 10,
    docsInGroup: 1
  }
  }, function(err, xmlResults) {
    if (err) return next(err);
    //data.keyword.yandexScanResult = xmlResults;

    xml2js.parseString(xmlResults, {trim: true}, function (err, result) {
      if (err) return next(err);

      if (result.yandexsearch.response[0].error) {
        return next(result.yandexsearch.response[0].error[0]._);
      }

      var response = result.yandexsearch.response[0].results[0];
      next(null, response);
    });
  });
};

YandexSvc.prototype.getSitesByKeyword = function (site, keyword, options, next) {
  this.searchByKeyword(site, keyword, options, function(err, result) {
    if (err) { return next(err); }

    var groups = result.grouping[0].group,
      url,
      urls = _.map(groups, function(item) {
        url = item.doc[0].url[0];
        if(options.regex !== undefined) {
          var domain = url.match(options.regex);
          url = domain ? domain[0] : url;
        }
        return url;
      });

    next(null, urls);
  });
};

YandexSvc.prototype.getUrlPosition = function (site, url, keyword, options, next) {
  this.getSitesByKeyword(site, keyword, options, function(err, urls) {
    if (err) { return next(err); }

    var indexHtml = _.indexOf(urls, url),
      indexAjax = _.indexOf(urls, url + '#!');

    next(null, (indexHtml >= 0 ? indexHtml : indexAjax) + 1);
  });
};

YandexSvc.prototype.getLimits = function(url, currentTime, next) {
  currentTime = currentTime || new Date();
  var self = this;

  yandex(
    {url: url, action: 'limits-info', query: 'limits-info'},
    function(err, xmlResults) {
      if (err) return next(err);

      xml2js.parseString(xmlResults, {trim: true}, function (err, result) {
        if (err) return next(err);

        if(!result.yandexsearch || !result.yandexsearch.response[0] || result.yandexsearch.response[0].error !== undefined) {
          var errMsg = 'empty';
          if(result.yandexsearch.response[0] !== undefined && result.yandexsearch.response[0].error !== undefined) {
            errMsg = result.yandexsearch.response[0].error;
            self.app.log.error(errMsg);
          }
          return next(errMsg);
        }

        var intervals = result.yandexsearch.response[0].limits[0]['time-interval'],

        currentInterval = intervals.filter(interval => {
          return (currentTime >= new Date(interval['$'].from) && currentTime <= new Date(interval['$'].to));
        });

        next(null, currentInterval[0]["_"]);
      });

  });
}

module.exports = YandexSvc;