'use strict';


const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Common = require('./common');


const internals = {};


internals.reduceFileObjects = (dir, json) => json.reduce((memo, item) => {
  const relativePath = new Buffer(item.path.replace(dir, '').slice(1)).toString('base64');
  if (item.content) {
    memo[relativePath] = item.content;
  }
  else if (item.children) {
    memo[relativePath] = internals.reduceFileObjects(item.path, item.children);
  }
  return memo;
}, {})


internals.readFile = (file, cb) => Fs.stat(file, (err, stat) => {
  if (stat.isDirectory()) {
    return internals.dirToJSON(file, (err, result) => {
      if (err) {
        return cb(err);
      }
      cb(null, { path: file, children: result });
    });
  }

  Fs.readFile(file, 'utf8', (err, data) => {
    if (err) {
      return cb(err);
    }

    cb(null, { path: file, content: data });
  });
});


internals.dirToJSON = (dir, cb) => Fs.readdir(dir, (err, files) => {
  if (err) {
    return cb(err);
  }

  Async.map(
    files.map(file => Path.join(dir, file)),
    internals.readFile,
    cb
  );
});


internals.parseExercise = (result, dir, cb) => internals.dirToJSON(
  dir,
  (err, json) => {
    if (err) {
      return cb(err);
    }

    const slug = Path.basename(dir);
    const filesObj = internals.reduceFileObjects(dir, json);
    const readmeKey = new Buffer('README.md').toString('base64');
    const { [readmeKey]: readme, ...files } = filesObj;

    if (!readme) {
      result.log.push(['warn', `${slug} => Empty or missing exercise README.md`]);
      return cb(null, {});
    }

    if (!result.result.exercises) {
      result.result.exercises = {};
    }

    try {
      Object.assign(result.result.exercises, {
        [slug]: Object.assign(Common.parseReadme(readme, {
          environment: 'env',
          entorno: 'env',
          env: 'env',
        }), { files })
      });
    }
    catch (err) {
      console.log(err);
      result.log.push(['error', `${slug} => ${err.message}`]);
    }

    cb(null, result);
  }
);


module.exports = (path, result) => (dir, cb) => internals.parseExercise(
  result,
  Path.join(path, result.result.unitDir, result.result.partDir, dir),
  cb
);
