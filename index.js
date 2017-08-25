#! /usr/bin/env node

'use strict';


const Path = require('path');
const Async = require('async');
const Minimist = require('minimist');
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


internals.processCourse = opts => (path, cb) => Course(
  path,
  opts,
  (err, course) => (err && cb(err)) || Syllabus(course, cb)
);


//
// Public API
//
// Crea un objetos JSON con la representación de cada curso dadas las rutas
// (paths) a los README.md de los cursos.
//
module.exports = (paths, opts, cb) => Async.map(
  paths.map(path => Path.resolve(process.cwd(), path)),
  internals.processCourse(opts),
  cb
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
    (err, courses) => {
      if (err) {
        throw err;
      }
      console.log(JSON.stringify(courses, null, 2));
    }
  );
}
