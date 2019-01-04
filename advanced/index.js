const { createLogger } = require('../lib/logger');
const {
  createTransport: createSqliteTransport
} = require('../lib/transport-sqlite');

module.exports = {
  createLogger,
  createSqliteTransport
};
