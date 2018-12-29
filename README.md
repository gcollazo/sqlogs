# sqlogs

### Quickly send a copy of your `console.log` messages to a SQLite database that you can easily query.

```bash
$ npm install sqlogs
```

```js
// Import and overwrite console.log
console.log = require('sqlogs');

// Works as usual but also writes a log entry in sqlite
console.log('Hello, world!');
```

```bash
$ sqlite3 sqlogs.sqlite "SELECT * FROM logs"
```

### Why?

Often I find my self writing small shell scripts that perform sequential tasks that might get interrupted unexpectedly. In these situations I want to have logs stored on disk that will allow me to check when and where the script stopped and resume from that point on.

Currently I use text files to which JSON strings are appended. This works fine but when I need to filter and sort data things get complicated.

SQL makes filtering and sorting super easy.

### How?

I usually start by writing a bunch of `console.log` statements while building the script. When I'm done I just install **sqlogs** and assign it to `console.log` at the top of the file and that's it.

The module will create a file on the same directory that the script is invoked on. The file is named `./sqlogs.sqlite`. A table `logs` is created and all `console.log` statements are inserted.

### Configuration

You can optionally pass an options object as the last argument to change a few settings. Currently you can set the `group`, `level` and add additional columns by setting a `meta` key to an object. The options object must include a `sqlogs` key with all options. See usage examples below.

### Usage Examples

```js
// This is how I usually use this
console.log = require('sqlogs');

// Just write a simple message
console.log('Hello, world!');

// You can pass an options object
console.log('Message', { sqlogs: { group: 'my-script', level: 'DEBUG' } });

// Items in the meta key if needed
// will create columns in the database
console.log('Message', { sqlogs: { meta: { userId: '123' } } });

// Passing multiple arguments also works
console.log(
  'Uno',
  ['Dos'],
  { three: 'Tres' },
  { sqlogs: { meta: { lang: 'ES' } } }
);
```

### Without overwriting `console.log` (probably a better idea)

```js
const log = require('sqlogs');

// Just write a simple message
log('Hello, world!');
```
