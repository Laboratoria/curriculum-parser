'use strict';


const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Common = require('./common');
const Part = require('./part');


const internals = {};


internals.readPartDir = (path, unitDir, partDirs, cb) =>
  Async.map(partDirs, Part(path, unitDir), cb);


module.exports = path => (unitDir, cb) => Fs.readdir(
	Path.join(path, unitDir),
	(err, files) =>
		(err && cb(err)) ||
		  internals.readPartDir(path, unitDir, files.filter(Common.isDirname), cb)
);
