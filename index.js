#! /usr/bin/env node

'use strict';


const Path = require('path');
const Async = require('async');
const Minimist = require('minimist');
const Chalk = require('chalk');
const Course = require('./lib/course');
const Syllabus = require('./lib/syllabus');
const Stats = require('./lib/stats');


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


// reduce arreglo de resultados con todos los cursos (último paso)
internals.reduce = results => results.reduce((memo, item) => {
  if (!item) {
    return memo;
  }
  const { slug, ...rest } = item.result;
  memo.courses[slug] = rest;
  memo.log = memo.log.concat(item.log);
  return memo;
}, { courses: {}, log: [] });


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


internals.printLog = ({ courses, log }) => {
  log.forEach(item => console.log(
    `${internals.severityString(item[0])}: ${Chalk.grey(item[1])}`
  ));
  internals.printStats(courses);
  process.exit(log.filter(log => log[0] === 'error').length ? 1 : 0);
};


internals.printStats = courses => {
  Object.keys(courses).forEach(courseKey => {
    const course = courses[courseKey];
    const unitKeys = Object.keys(course.syllabus);
    console.log(`---\n\n# ${course.title} (${courseKey})\n`);
    console.log(`Duration: ${course.stats.durationString}`);
    console.log(`Units: ${course.stats.unitCount}`);
    console.log(`Parts: ${course.stats.partCount}`);
    console.log(`Exercises: ${course.stats.exerciseCount}\n`);
    unitKeys.forEach((unitKey, unitIdx) => {
      const unit = course.syllabus[unitKey];
      const partKeys = Object.keys(unit.parts || {});
      console.log(`\n## Unit ${unitIdx + 1}: ${unit.title} (${unitKey})\n`);
      console.log(`Duration: ${unit.stats.durationString}`);
      console.log(`Parts: ${unit.stats.partCount}`);
      console.log(`Exercises: ${unit.stats.exerciseCount}\n`);
      partKeys.forEach(partKey => {
        const part = unit.parts[partKey];
        const extercises = (part.exerciseCount) ? `[ ${Object.keys(part.exerciseCount).length} ejercicio(s) ]` : '';
        if (part.type === 'practice') {
          // console.log(part);
        }
        console.log(`| ${partKey} | ${part.type} | ${part.format} | ${part.durationString} | ${part.title} ${extercises}`);
      });
    });
  });
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
    cb(null, Stats(internals.reduce(results)));
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
        return internals.printLog(result);
      }
      console.log(JSON.stringify(result.courses, null, 2));
    }
  );
}
