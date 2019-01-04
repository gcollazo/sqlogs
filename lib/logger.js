const { Writable } = require('stream');

class LogStream extends Writable {
  constructor(options) {
    super(options);
    let { transport } = options;
    this.transport = transport;
  }

  _write(chunk, encoding, callback) {
    this.transport(...chunk).then(() => {
      callback();
    });
  }
}

function createLogger(transport) {
  let stream = new LogStream({ objectMode: true, transport });

  return (...args) => {
    stream.write(args);
  };
}

module.exports = {
  createLogger
};
