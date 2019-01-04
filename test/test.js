/* eslint-env mocha */

const fs = require('fs');
const assert = require('assert');
const sqlite = require('sqlite');

const { createTransport, defaultDbPath } = require('../lib/transport-sqlite');
const log = createTransport({ path: defaultDbPath });

const simple = require('../sqlogs');
const { createLogger: advanced } = require('../advanced');
const ADVANCED_PATH = './advanced.sqlite';

const SELECT_TABLES_QUERY =
  /* eslint-disable-next-line quotes */
  "SELECT name, sql FROM sqlite_master WHERE type='table'";

function deleteDatabaseFile() {
  try {
    fs.unlinkSync(defaultDbPath);
  } catch (e) {
    // pass
  }

  try {
    fs.unlinkSync(ADVANCED_PATH);
  } catch (e) {
    // pass
  }
}

function pollFile(path, callback) {
  let file;

  function startPolling() {
    try {
      file = fs.readFileSync(path);
    } catch (e) {
      // pass
    }

    if (file && file.length > 0) {
      return callback(file);
    } else {
      setTimeout(() => {
        startPolling();
      }, 10);
    }
  }

  startPolling();
}

describe('sqlogs', function() {
  beforeEach('cleanup before each test', function() {
    deleteDatabaseFile();
  });

  after('cleanup after tests', function() {
    deleteDatabaseFile();
  });

  it('should do a simple log', function(done) {
    simple('Simple', { sqlogs: { silent: true } });
    pollFile(defaultDbPath, (file) => {
      assert.equal(file.length > 0, true);
      done();
    });
  });

  it('should do an advanced log', function(done) {
    let adv = advanced(createTransport({ path: ADVANCED_PATH }));
    adv('Advanced', { sqlogs: { silent: true } });
    pollFile(ADVANCED_PATH, (file) => {
      assert.equal(file.length > 0, true);
      done();
    });
  });
});

describe('sqlogs/lib/transport-sqlite', function() {
  beforeEach('cleanup before each test', function() {
    deleteDatabaseFile();
  });

  after('cleanup after tests', function() {
    deleteDatabaseFile();
  });

  it('should create sqlogs.sqlite file on disk', async function() {
    await log('Hello', { sqlogs: { silent: true } });
    let file = fs.readFileSync(defaultDbPath);
    assert.equal(file.length > 0, true);
  });

  it('should create table named logs', async function() {
    await log('Hello', { sqlogs: { silent: true } });
    let db = await sqlite.open(defaultDbPath);
    let result = await db.get(SELECT_TABLES_QUERY);
    assert.equal(result.name, 'logs');
  });

  it('should create table schema', async function() {
    await log('Hello', { sqlogs: { silent: true } });
    let schema =
      'CREATE TABLE `logs` ' +
      '(`id` integer NOT NULL PRIMARY KEY, `message` text, ' +
      '`timestamp` text, `group` text, `level` text)';
    let db = await sqlite.open(defaultDbPath);

    let result = await db.get(SELECT_TABLES_QUERY);
    assert.equal(result.sql, schema);
  });

  it('should insert simple message', async function() {
    await log('Hello', { sqlogs: { silent: true } });
    let db = await sqlite.open(defaultDbPath);
    let result = await db.all('SELECT * FROM logs');
    assert.equal(result.length, 1);
    assert.equal(result[0].message, 'Hello');
  });

  it('should insert simple message without options', async function() {
    await log('');
    let db = await sqlite.open(defaultDbPath);
    let result = await db.all('SELECT * FROM logs');
    assert.equal(result.length, 1);
    assert.equal(result[0].message, '');
  });

  it('should have a default group of DEFAULT', async function() {
    await log('Hello', { sqlogs: { silent: true } });
    let db = await sqlite.open(defaultDbPath);
    let result = await db.get('SELECT * FROM logs');
    assert.equal(result.group, 'DEFAULT');
  });

  it('should have a default level of INFO', async function() {
    await log('Hello', { sqlogs: { silent: true } });
    let db = await sqlite.open(defaultDbPath);
    let result = await db.get('SELECT * FROM logs');
    assert.equal(result.level, 'INFO');
  });

  it('should have a timestamp', async function() {
    await log('Hello', { sqlogs: { silent: true } });
    let db = await sqlite.open(defaultDbPath);
    let result = await db.get('SELECT * FROM logs');
    assert.equal(result.timestamp !== null, true);
  });

  it('should create a new column when the meta is passed', async function() {
    await log('Hello', { sqlogs: { silent: true, meta: { newCol: '1' } } });
    let schema =
      'CREATE TABLE `logs` ' +
      '(`id` integer NOT NULL PRIMARY KEY, `message` text, ' +
      '`timestamp` text, `group` text, `level` text, `newCol` text)';
    let db = await sqlite.open(defaultDbPath);
    let result = await db.get(SELECT_TABLES_QUERY);
    assert.equal(result.sql, schema);
  });

  it('should assign meta to correct column', async function() {
    await log('Hello', { sqlogs: { silent: true, meta: { metaColumn: '1' } } });
    let db = await sqlite.open(defaultDbPath);
    let result = await db.get('SELECT metaColumn FROM logs');
    assert.equal(result.metaColumn, '1');
  });

  it('should accept multiple values: string, array, object', async function() {
    await log('Uno', ['Dos'], { three: 'Three' }, { sqlogs: { silent: true } });
    let db = await sqlite.open(defaultDbPath);
    let result = await db.get('SELECT * FROM logs');
    assert.equal(result.message, 'Uno ["Dos"] {"three":"Three"}');
  });
});
