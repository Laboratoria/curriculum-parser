'use strict';


const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Common = require('./common');
const Exercise = require('./exercise');
const Quiz = require('./quiz');


const internals = {};


internals.parseExercises = (path, result, cb) => Async.map(
  result.files.filter(Common.isDirname),
  Exercise(path, result),
  (err, exercises) => {
    if (err) {
      return cb(err);
    }
    cb(null, result);
  }
);


internals.parseReadme = (path, result, data, cb) => {
  const { unitDir, partDir} = result.result;
  const slug = `${unitDir}/${partDir}`;

  try {
    Object.assign(result.result, Common.parseReadme(data, {
      tipo: 'type',
      type: 'type',
      formato: 'format',
      format: 'format',
      duración: 'duration',
      duration: 'duration',
    }));
  }
  catch (err) {
    result.log.push(['error', `${slug} => ${err.message}`]);
  }

  // parse duration
  result.result.duration = Common.parseDuration(result.result.duration);
  if (result.result.duration === null) {
    result.log.push(['error', `${slug} => Could not parse part duration`]);
  }

  if (result.result.type === 'practice') {
    return internals.parseExercises(path, result, cb);
  }
  else if (result.result.type === 'quiz') {
    result.result.questions = Quiz(result.result.body);
    delete result.result.body;
  }

  cb(null, result);
};


internals.readPartReadme = (path, result, cb) => Fs.readFile(
	Path.join(path, result.result.unitDir, result.result.partDir, 'README.md'),
	'utf8',
	(err, data) => {
    if (err) {
      return cb(err);
    }
    internals.parseReadme(path, result, data, cb);
  }
);


module.exports = (path, unitDir) => (partDir, cb) => Fs.readdir(
	Path.join(path, unitDir, partDir),
	(err, files) => {
    const result = {
      result: { unitDir, partDir },
      log: [],
      files
    };

		if (err) {
      if (err.code === 'ENOTDIR') {
        result.log.push(['warn', `Expected ${err.path} to be a directory!`]);
        return cb(null, result);
      }
			return cb(err);
		}

		if (files.indexOf('README.md') === -1) {
			result.log.push(['warn', `Part ${unitDir}/${partDir} is missing README.md`]);
			return cb(null, result);
		}

		internals.readPartReadme(path, result, cb);
	}
);
