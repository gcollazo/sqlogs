const { Writable } = require('stream');
const { createLogHandler } = require('./log');

const DB_FILE_PATH = './sqlogs.sqlite';

class LogStream extends Writable {
  constructor(options) {
    super(options);
    this.logHandler = options.logHandler;
  }

  _write(chunk, encoding, callback) {
    this.logHandler(...chunk).then(() => {
      callback();
    });
  }
}

module.exports = {
  createLogger: ({ path = DB_FILE_PATH } = { path: DB_FILE_PATH }) => {
    let logHandler = createLogHandler({ dbFilePath: path });
    let stream = new LogStream({ objectMode: true, logHandler });

    return (...args) => {
      stream.write(args);
    };
  }
};
