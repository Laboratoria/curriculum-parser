#! /usr/bin/env node

'use strict';


const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Course = require('./lib/course');
const SyllabusItem = require('./lib/syllabus-item');


module.exports = (cwd, cb) => {

  Course(cwd, (err, course) => {

    if (err) {
      return cb(err);
    }

    Async.map(course.syllabus, Async.apply(SyllabusItem, cwd), (err, items) => {

      if (err) {
        return cb(err);
      }

      cb(null, Object.assign({}, course, { syllabus: items }));
    });
  });
};


if (require.main === module) {
  module.exports(process.cwd(), (err, course) => {

    if (err) {
      throw err;
    }

    console.log(JSON.stringify(course, null, 2));
  });
}
