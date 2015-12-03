'use strict';

var convict = require('convict');
var path = require('path');

var conf = convict({
  env: {
    doc: 'The application environment.',
    format: ['production', 'development', 'test'],
    default: 'development',
    env: 'NODE_ENV',
    arg: 'env'
  },
  mongo: {
    db: {
      doc: 'Mongodb connection string',
      format: String,
      default: 'mongodb://127.0.0.1:27017/test',
      env: 'MONGO_URI'
    }
  },
  http: {
    port: {
      doc: 'HTTP port to bind.',
      format: 'port',
      default: 8080,
      env: 'HTTP_PORT'
    }
  },
  log: {
    stdout: {
      enabled: {
        doc: 'Log to stdout',
        format: Boolean,
        default: true
      },
      level: {
        doc: 'Stdout level',
        format: Number,
        default: 0
      }
    },
    file: {
      enabled: {
        doc: 'Log to file',
        format: Boolean,
        default: false
      }
    },
    syslog: {
      enabled: {
        doc: 'Log to syslog',
        format: Boolean,
        default: false
      },
      level: {
        doc: 'Syslog level',
        format: Number,
        default: 0
      }
    }
  }
});

var filePath = path.resolve(__dirname, 'cfg', conf.get('env') + '.json');
conf.loadFile(filePath);
conf.validate();

module.exports = conf;
