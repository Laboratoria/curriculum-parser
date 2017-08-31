'use strict';


const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Marked = require('marked');
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


internals.parseReadme = data => {
  const tokens = Marked.lexer(data);
  const title = (tokens[0].type === 'heading' && tokens[0].depth === 1) ?
    tokens[0].text : null;
  const description = Common.tokensToHTML(tokens.slice(1), tokens.links);
  return { title, description };
}


internals.parseExercise = (result, dir, cb) => internals.dirToJSON(
  dir,
  (err, json) => {
    if (err) {
      return cb(err);
    }

    const filesObj = internals.reduceFileObjects(dir, json);

    const readmeKey = new Buffer('README.md').toString('base64');
    const { [readmeKey]: readme, ...rest } = filesObj;

    if (!readme) {
      result.log.push(['warn', `Empty or missing exercise README.md in ${dir}`]);
      return cb(null, {});
    }

    const slug = Path.basename(dir);
    const { title, description } = internals.parseReadme(readme);

    if (!result.result.exercises) {
      result.result.exercises = {};
    }

    result.result.exercises[slug] = { title, description, files: rest };
    cb(null, result);
  }
);


module.exports = (path, result) => (dir, cb) => internals.parseExercise(
  result,
  Path.join(path, result.result.unitDir, result.result.partDir, dir),
  cb
);
