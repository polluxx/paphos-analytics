var server = require('./server');

server.init(function(err) {
  console.log(err);
  if (err) {
    server.app.log.error(err);
    process.exit(1);
    return;
  }

  server.start();
});