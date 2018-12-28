/* eslint-disable prefer-destructuring */
const sqlite = require('sqlite');

const DB_FILE_PATH = './sqlogs.sqlite';
let database = sqlite.open(DB_FILE_PATH);

async function createTable(db) {
  await db.run(
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

async function log(...args) {
  let options = null;

  if (args.length > 1) {
    let lastItem = args[args.length - 1];
    if (lastItem.sqlogs) {
      options = lastItem.sqlogs;
      args.pop();
    }
  }

  let message = args.reduce((prev, next) => {
    if (typeof next === 'object') {
      prev = `${prev} ${JSON.stringify(next)}`;
    } else {
      prev = `${prev} ${next}`;
    }
    return prev;
  }, '');

  // Write to stdout
  process.stdout.write(`${message}\n`);

  let db = await database;
  await createTable(db);

  let cols = '`timestamp`, `group`, `level`, `message`';
  let values = '?, ?, ?, ?';

  let group = 'DEFAULT';
  if (options && options.group) {
    group = options.group;
  }

  let level = 'INFO';
  if (options && options.level) {
    level = options.level;
  }

  let meta = {};
  let metaCols = null;
  if (options && options.meta) {
    metaCols = await addMissingColumns(db, options.meta);
    meta = options.meta;
  }
  if (metaCols) {
    metaCols.forEach((col) => {
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
