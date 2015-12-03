exports.init = function (app) {

 // var access = require('../middleware/access.js'),
  var resourceRoute = require('./default.js');

  app.server.get('/api', function(req, res, next){
    res.json({ success: true });
  });

  app.server.use('/api/auth', require('./auth.js'));
  app.server.use('/api/sites', require('./sites.js'));
  app.server.use('/api/pages', require('./pages.js'));
  app.server.use('/api/queries', require('./queries.js'));


  app.server.get('/api/:resource', resourceRoute);
  app.server.get('/api/:resource/:_id', resourceRoute);

/*
  app.server.post('/api/:resource', access(), resourceRoute);
  app.server.put('/api/:resource/:_id', access(), resourceRoute);
  app.server.delete('/api/:resource/:_id', access(), resourceRoute);
*/
};