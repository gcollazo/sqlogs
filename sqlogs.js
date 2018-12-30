/* eslint-disable prefer-destructuring */
const sqlite = require('sqlite');
const get = require('lodash/get');
const last = require('lodash/last');
const DB_FILE_PATH = './sqlogs.sqlite';

function createTable(db) {
  return db.run(
    'CREATE TABLE IF NOT EXISTS `logs` ' +
      '(`id` integer NOT NULL PRIMARY KEY, `message` text, ' +
      '`timestamp` text, `group` text, `level` text);'
  );
}

async function addMissingColumns(db, fields) {
  let cols = Object.keys(fields);
  if (cols.length) {
    let addCols = cols.map((c) => {
      return `ADD COLUMN \`${c}\` text`;
    });
    for (let col of addCols) {
      let statement = `ALTER TABLE \`logs\` ${col};`;
      try {
        await db.run(statement);
      } catch (error) {
        // ignore duplicate column error
        if (!error.message.match(/duplicate column/gi)) {
          throw error;
        }
      }
    }
  }
  return cols;
}

function prepareMessage(args) {
  return args
    .reduce((prev, next) => {
      if (typeof next === 'object') {
        prev = `${prev} ${JSON.stringify(next)}`;
      } else {
        prev = `${prev} ${next}`;
      }
      return prev;
    }, '')
    .trim();
}

function parseOptions(options) {
  let group = get(options, 'group', 'DEFAULT');
  let level = get(options, 'level', 'INFO');
  let silent = get(options, 'silent', false);
  let meta = get(options, 'meta', {});
  return { group, level, meta, silent };
}

async function log(...args) {
  // Try to get options
  let options = get(last(args), 'sqlogs', null);

  // parse user options
  let { group, level, meta, silent } = parseOptions(options);

  // remove sqlogs options from arguments
  // so we don't store or print them
  if (options) {
    args.pop();
  }

  // process message
  let message = prepareMessage(args);

  // write to stdout, skip if silent option is true
  if (!silent) {
    process.stdout.write(`${message}\n`);
  }

  // async stuff starts here
  let db = await sqlite.open(DB_FILE_PATH);

  // create table if necessary
  await createTable(db);

  // create missing columns
  let newColumns = await addMissingColumns(db, meta);

  // sql statement
  let cols = '`timestamp`, `group`, `level`, `message`';
  let values = '?, ?, ?, ?';

  // modify sql statement with new columns
  if (newColumns) {
    newColumns.forEach((col) => {
      cols += `, \`${col}\``;
      values += ', ?';
    });
  }

  try {
    await db.run('INSERT INTO logs ' + `(${cols}) ` + `VALUES (${values})`, [
      JSON.parse(JSON.stringify(new Date())),
      group,
      level,
      message,
      ...Object.values(meta)
    ]);
  } catch (error) {
    console.error(error);
  }
}

module.exports = log;
