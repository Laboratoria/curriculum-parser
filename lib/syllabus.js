'use strict';


const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Common = require('./common');
const Unit = require('./unit');


const internals = {};


internals.toObject = units => units.reduce((memo, unit) => {
  unit.forEach(part => {
    const { unitDir, partDir, ...rest } = part;
    if (!memo[unitDir]) {
      memo[unitDir] = {};
    }
    memo[unitDir][partDir] = rest;
  });
  return memo;
}, {});


internals.readUnits = (course, unitDirs, cb) => Async.map(
  unitDirs,
  Unit(course),
  (err, units) => {
    if (err) {
      return cb(err);
    }
    cb(null, Object.assign({}, course, {
      units: internals.toObject(units)
    }));
	}
);


//
// Read syllabus from filesystem (not from main readme).
//
module.exports = (course, cb) => Fs.readdir(
	course.path,
	(err, files) =>
	  (err && cb(err)) ||
		  internals.readUnits(course, files.filter(Common.isDirname), cb)
);
