'use strict';


const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Common = require('./common');
const Part = require('./part');


const internals = {};


internals.readPartDir = (course, unitDir, partDirs, cb) =>
  Async.map(partDirs, Part(course, unitDir), cb);


module.exports = course => (unitDir, cb) => Fs.readdir(
	Path.join(course.path, unitDir),
	(err, files) =>
		(err && cb(err)) ||
		  internals.readPartDir(course, unitDir, files.filter(Common.isDirname), cb)
);
