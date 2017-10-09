#! /usr/bin/env node

'use strict';


const Path = require('path');
const Async = require('async');
const Minimist = require('minimist');
const Chalk = require('chalk');
const Course = require('./lib/course');
const Syllabus = require('./lib/syllabus');


const internals = {};


internals.parseArgs = args => Object.keys(args).reduce((memo, key) => {
  if (key === '_') {
    memo.paths = args._;
  }
  else {
    memo.opts[key] = args[key];
  }
  return memo;
}, { paths: [], opts: {}});


// mezcla el syllabus leido en el README.md principal con las unidades leídas
// de las subcarpetas
internals.merge = results => {
  const syllabus = results.course.result.syllabus.reduce((memo, item) => {
    const { href, parts, ...rest } = item;
    memo[href] = rest;
    memo[href].parts = results.syllabus.result[href];
    return memo;
  }, {});

  return {
    result: Object.assign(results.course.result, { syllabus }),
    log: results.course.log.concat(results.syllabus.log)
  };
};


internals.processPath = (path, cb) => Async.auto({
  // procesa README.md principal del curso
  course: Async.apply(Course, path),
  // lee unidades del syllabus en subcarpetas
  syllabus: Async.apply(Syllabus, Path.dirname(path))
}, (err, results) => {
  if (err) {
    return cb(err);
  }
  cb(null, internals.merge(results));
});


internals.severityKeyToColor = {
  error: 'red',
  warn: 'yellow',
  info: 'blue'
};


internals.severityString = str => Chalk[internals.severityKeyToColor[str]](str);


internals.printLog = log => {
  log.forEach(item => console.log(
    `${internals.severityString(item[0])}: ${Chalk.grey(item[1])}`
  ));
  process.exit(log.filter(log => log[0] === 'error').length ? 1 : 0);
};


//
// Public API
//
// Crea un objeto JSON con la representación de cada curso dadas las rutas
// (paths) a los README.md de los cursos.
//
module.exports = (paths, opts, cb) => Async.map(
  paths.map(path => Path.resolve(process.cwd(), path)),
  internals.processPath,
  (err, results) => {
    if (err) {
      return cb(err);
    }

    cb(null, results.reduce((memo, item) => {
      if (!item) {
        return memo;
      }
      const { slug, ...rest } = item.result;
      memo.courses[slug] = rest;
      memo.log = memo.log.concat(item.log);
      return memo;
    }, { courses: {}, log: [] }))
  }
);


//
// Si el script se ha invocado directamente desde la línea de comando parseamos
// los argumentos e invocamos...
//
if (require.main === module) {
  const { paths, opts } = internals.parseArgs(Minimist(process.argv.slice(2)));
  module.exports(
    paths,
    opts,
    (err, result) => {
      if (err) {
        throw err;
      }

      if (opts.validate) {
        return internals.printLog(result.log);
      }
      console.log(JSON.stringify(result.courses, null, 2));
    }
  );
}
