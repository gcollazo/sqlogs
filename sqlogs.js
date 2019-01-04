const { createLogger } = require('./lib/logger');
const {
  createTransport: createSqliteTransport,
  defaultDbPath
} = require('./lib/transport-sqlite');

module.exports = createLogger(createSqliteTransport({ path: defaultDbPath }));
