'use strict';

var async = require('async'),
  _ = require('lodash'),
  mongoose = require('mongoose');

function getFilter(req, next) {
  var params = req.query;
  delete params.sort;

  var filter = {
    $and: [_.mapValues(params, function (val) {
      if (_.isArray(val)) {
        return {$in: val};
      } else if (val === 'null') {
        return null;
      } else {
        return val;
      }
    })]
  };
  filter.$and.push({removed: {$exists: false}});
  var search = req.query['search'];
  if (search && req.resource && req.resource.options && req.resource.options.searchFields) {
    filter.$and.push({
      $or: _.map(req.resource.options.searchFields, function (field) {
        var o = {};
        o[field] = {$regex: search, $options: 'i'};
        return o;
      })
    });
  }
  return filter;
}

function getDataOptions(req) {
  var opts = {};

  if (req.query['perPage']) {
    opts.skip = req.query['page'] ? (req.query['page'] - 1) * req.query['perPage'] : 0;
    opts.limit = req.query['perPage'];
  }

  // Parse request sorting parameters
  var sort = req.query['sort'];
  if (sort) {
    var sortArr = _.without(_.isArray(sort) ? sort : sort.replace(/ /g, '').split(','), '');
    if (sortArr.length > 0) {
      opts.sort = {};
      _.each(sortArr, function (field) {
        var direction = 1;
        if (field.indexOf('-') === 0) {
          direction = -1;
          field = field.substring(1);
        }
        opts.sort[field] = direction;
      });
    }
  }
  return opts;
}

function processGet(model, req, res, next) {
  if (req.params._id) {
    req.query._id = req.params._id;
  }

  var filter = getFilter(req),
    options = getDataOptions(req);
  console.log(filter);

  if (req.params._id || req.query.alias) {
    model.findOne(filter, function (err, data) {
      if (err) {
        if (err.name === 'CastError') {
          return next(req.app.errors.NotFoundError('Resource "' + req.params.resource + ' ' + parameter + '" not found.'));
        } else {
          return next(err);
        }
      }
      if (data) {
        if (model.schema.paths.viewsCount) {
          model.update(parameter, {$inc: {viewsCount: 1}}, function (err) {
            if (err) {
              return req.log.error(err);
            }
          });
        }
        return res.json(data);
      } else {
        return next(req.app.errors.NotFoundError('Resource "' + req.params.resource + ' ' + parameter + '" not found.'));
      }
    });
  } else {
    async.auto({
      count: function (next, result) {
        if (req.query.flags && req.query.flags.indexOf('no-total-count') !== -1) {
          return next(null, -1);
        }
        model.count(filter, next);
      },
      items: function (next, result) {
        model.find(filter, {}, options, next);
      }
    }, function (err, data) {
      if (err) { return next(err); }

      if (data.count !== -1) {
        res.set('x-total-count', data.count);
      }
      return res.json(data.items);
    });
  }
}



function processPost(model, fieldsObj, req, res, next) {
  var bodyFields = acl.util.json.getFields(req.body);
  var updateFields = _.without(_.intersection(fieldsObj.fields, bodyFields), '__v');
  var body = deepPick(req.body, updateFields);
  req.app.services.validation.validate(req, req.params.resource + '.post', body, function (err, modelState) {
    if (err) {
      return next(err);
    }
    if (modelState.hasErrors) {
      res.status(422).json(modelState);
    } else {
      req.app.services.hooks.hookAll(req, 'post', req.params.resource, body, function (err) {
        if (err) {
          return next(err);
        }
        body._id = mongoose.Types.ObjectId();
        if (model.schema.paths['site._id']) {
          body.site = {
            _id: req.site._id,
            domain: req.site.domain
          };
        }
        body = _.pick(body, function(item) {
          return item !== null;
        });
        var item = new model(body);
        item.save(function (err, obj) {
          if (err) {
            return next(err);
          }
          req.log.info({
            refs: [
              {resourceId: obj._id, title: obj.title, collectionName: req.params.resource}
            ]
          }, 'Resource "' + req.params.resource + '" created.');

          req.log.info({_id: obj._id}, 'db.' + req.params.resource + '.insert');

          req.app.services.mq.push(req.app, 'events', {
              name: 'db.' + req.params.resource + '.insert',
              _id: obj._id
            },
            function (err) {
              if (err) { return next(err); }

              res.status(201).json({_id: obj._id, alias: obj.alias});
            });
        });
      });
    }
  });
}


module.exports = function processRequest(req, res, next) {
  var resourceName = req.params.resource,
    model = req.app.models[resourceName];
  if (!model) {
    return next(req.app.errors.NotFoundError('Resource "' + resourceName + '" not found.'));
  }

  var method = req.method.toLowerCase();
  switch (method) {
    case 'get':
      processGet(model, req, res, next);
      break;
    case 'post':
      processPost(model, fieldsObj, req, res, next);
      break;
    case 'put':
      processPut(model, fieldsObj, req, res, next);
      break;
    default:
      next();
  }
};

