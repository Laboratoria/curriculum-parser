'use strict';


const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Common = require('./common');
const Unit = require('./unit');


const internals = {};


internals.toObject = units => units.reduce((memo, unit) => {
  unit.forEach(part => {
    const { unitDir, partDir, ...rest } = part.result;
    if (!memo.result[unitDir]) {
      memo.result[unitDir] = {};
    }
    memo.result[unitDir][partDir] = rest;
    memo.log = memo.log.concat(part.log);
  });
  return memo;
}, { result: {}, log: [] });


internals.readUnits = (path, unitDirs, cb) => Async.map(
  unitDirs,
  Unit(path),
  (err, units) => {
    if (err) {
      return cb(err);
    }
    cb(null, internals.toObject(units));
	}
);


//
// Read syllabus from filesystem (not from main readme).
//
module.exports = (path, cb) => Fs.readdir(
	path,
	(err, files) => {
	  if (err) {
      return cb(err);
    }
		internals.readUnits(path, files.filter(Common.isDirname), cb)
  }
);
