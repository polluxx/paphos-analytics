'use strict';

var router = require('express').Router(),
  mongoose = require('mongoose'),
  moment = require('moment'),
  _ = require('lodash'),
  async = require('async');

var getPagesStat = function(app, siteId, startDate, endDate, next) {
  var range1 = moment.range(startDate, endDate),
    diff = range1.diff('days'),
    startDate2 = moment(startDate).subtract(diff, 'day'),
    endDate2 = moment(endDate).subtract(diff, 'day');

  siteId = new mongoose.Types.ObjectId(siteId);

  console.log('siteId', siteId);
  async.auto({
    'stats1': function(next) {
      app.models.visitStatistics.aggregate([
        {
          $match: {
            'site._id': siteId,
            date: { $gte: startDate.toDate(), $lt: endDate.toDate() }
          }
        },
        {
          $group: {
            _id: { pageId: '$page._id' },
            sessions: { $sum: "$sessions" } ,
            users: { $sum: "$users" }
          }
        }
      ], next);
    },
    'stats2': function(next) {
      app.models.visitStatistics.aggregate([
        {
          $match: {
            'site._id': siteId,
            date: { $gte: startDate2.toDate(), $lt: endDate2.toDate() }
          }
        },
        {
          $group: {
            _id: { pageId: '$page._id' },
            sessions: { $sum: "$sessions" } ,
            users: { $sum: "$users" }
          }
        }
      ], next);
    },
    'diff': ['stats1', 'stats2', function(next, data) {
      var pages = {};
      _.each(data.stats1, function(item) {
        pages[item._id.pageId] = {
          users: item.users,
          sessions: item.sessions
        }
      });
      _.each(data.stats2, function(item) {
        if (pages[item._id.pageId]) {
          pages[item._id.pageId].oldUsers = item.users;
          pages[item._id.pageId].oldSessions = item.sessions;
        }
      });
      next(null, pages)
    }],
    'pages': ['diff', function(next, data) {
      var keys = _.keys(data.diff);
      app.models.pages.find({ _id: { $in: keys } }, next);
    }]
  }, function(err, data) {
    if (err) { return next(err); }

    var result = _.map(data.pages, function(item) {
      var stat = data.diff[item._id],
        page = item.toObject();
      page.users = stat.users;
      page.sessions = stat.sessions;
      page.oldUsers = stat.oldUsers;
      page.oldSessions = stat.oldSessions;
      if (stat.sessions && stat.oldSessions) {
        page.diffSessions = stat.sessions - stat.oldSessions;
      }
      if (stat.users && stat.oldUsers) {
        page.diffUsers = stat.users - stat.oldUsers;
      }
      return page;
    });
    next(null, result);
  });
};

router.get('/grown-up', function (req, res, next) {
  var endDate = moment.min(moment(), moment(req.query.date_to, 'YYYY-MM-DD')),
    startDate = moment.min(moment(), moment(req.query.date_from, 'YYYY-MM-DD')),
    siteId = req.query['site._id'];

  getPagesStat(req.app, siteId, startDate, endDate, function(err, result) {
    if (err) { return next(err); }

    result = _.filter(result, function(item) {
      return item.diffUsers > 0;
    });
    result = _.sortBy(result, function(item) {
      return -item.diffUsers;
    });
    result = _.take(result, 10);

    res.json(result)
  });
});

router.get('/drop-in', function (req, res, next) {
  var endDate = moment.min(moment(), moment(req.query.date_to, 'YYYY-MM-DD')),
    startDate = moment.min(moment(), moment(req.query.date_from, 'YYYY-MM-DD')),
    siteId = req.query['site._id'];

  getPagesStat(req.app, siteId, startDate, endDate, function(err, result) {
    if (err) { return next(err); }

    result = _.filter(result, function(item) {
      return item.diffUsers <= 0;
    });
    result = _.sortBy(result, function(item) {
      return item.diffUsers;
    });
    result = _.take(result, 10);

    res.json(result)
  });
});

router.get('/analytics', function (req, res, next) {
  var params = req.query,
    dateFromDef = params.dateFrom || moment(Date.now()).subtract(4, 'days'),
    dateToDef = params.dateFrom || moment(Date.now()).add(1, 'days'),
    dateFrom = moment(dateFromDef),
    dateTo = moment(dateToDef);

  async.auto({
    sites: function(next) {
      req.app.models.sites.find({_id: {$in: params.ids}}, next);
    },
    analytics: ['sites', function(next, data) {
      if(!data.sites.length) return next();

      var rawSitesData = {};
      data.sites.forEach(site => {
        req.app.models.visitStatistics.aggregate([
          {
            $match: {
              'site._id': site._id,
              date: { $gte: dateFrom.toDate(), $lt: dateTo.toDate()}
            }
          },
          {
            $group: {
              _id: { date: '$date' },
              sessions: { $sum: "$sessions" } ,
              users: { $sum: "$users" }
            }
          }
        ], function(err, resp) {
          if(err) return next(err);

          rawSitesData[site._id] = resp.map(record => {

            record.date = moment(record['_id'].date).format('YYYY-MM-DD')
            var positions = [], date, position;
            for (date = moment(dateFrom); date.isSameOrBefore(dateTo); date.add(1, 'day')) {
              position = _.find(record, { date: date.format('YYYY-MM-DD') });
              console.log('position r', position);
              positions.push(position ? {users: position.users, sessions: position.sessions}: 0);
            }
            record = positions;
            // console.log(positions);
            return record;
          })

          console.log(rawSitesData);
        });
      });
      next();
    }
  ]}, function(err, data) {
    if(err) return next(err);

    res.json(data);
  });

});

module.exports = router;