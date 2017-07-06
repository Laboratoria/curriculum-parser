'use strict';


const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Marked = require('marked');
const Common = require('./common');


const internals = {};


internals.isFile = (fname, cb) => {

  Fs.exists(fname, (exists) => {

    if (!exists) {
      return cb(new Error(`File ${fname} doesn't exist!`));
    }

    Fs.stat(fname, (err, stat) => {

      if (err) {
        return cb(err);
      }

      if (stat.isDirectory()) {
        return cb(new Error('Syllabus item part must be a file'));
      }

      cb(null, true);
    });
  });
};


internals.defaults = () => ({
  title: null,
  duration: null,
  type: null,
  learningObjectives: [],
  body: []
});


internals.parsePartLogistics = str => {

  const matches = /^(Formato|Tipo|Duración):\s+`(\d+(min|h)|(video|lectura|code|workshop))`/.exec(str);

  if (!matches || matches.length < 3) {
    return {};
  }

  if (matches[1] === 'Formato' || matches[1] === 'Tipo') {
    return { type: matches[2] };
  }
  else if (matches[1] === 'Duración') {
    return { duration: Common.parseDuration(matches[2]) };
  }
  else {
    return {};
  }
};


internals.tokensToPart = () => {

  let currSection = 'title';

  return (memo, token) => {

    if (token.type === 'heading') {
      if (token.depth === 1) {
        memo.title = token.text.replace(/^\d+\.\s/, '');
        currSection = 'body';
      }
      else if (token.depth === 2) {
        if (/objetivos/i.test(token.text)) {
          currSection = 'learningObjectives';
        }
      }
      else {
        memo[currSection].push(token);
      }
    }
    else if ((!memo.duration || !memo.format) && token.type === 'list_start') {
      currSection = 'logistics';
    }
    else if (currSection !== 'body' && token.type === 'list_end') {
      currSection = 'body';
    }
    else if (currSection === 'logistics' && token.type === 'text') {
      Object.assign(memo, internals.parsePartLogistics(token.text));
    }
    else if (!memo.body.length && token.type === 'hr') {
      currSection = 'body';
    }
    else if (currSection !== 'logistics') {
      //console.log(token.type);
      memo[currSection].push(token);
    }

    return memo;
  };
};


internals.parseFile = (fname, cb) => {

  Fs.readFile(fname, 'utf8', (err, data) => {

    if (err) {
      return cb(err);
    }

    cb(null, Marked.lexer(data).reduce(internals.tokensToPart(), internals.defaults()));
  });
};


internals.parsePartFile = (cwd, part, cb) => {

  if (!part || !part.href || !/\.md$/.test(part.href)) {
    return cb(null, part);
  }

  const fname = Path.join(cwd, part.href);

  Async.series([
    Async.apply(internals.isFile, fname),
    Async.apply(internals.parseFile, fname)
  ], (err, results) => {

    if (err) {
      console.error(err);
      return cb(null, part);
    }

    results[1].body = Common.parseTokens(results[1].body, []);

    if (results[1].title !== part.title) {
      results[1].titleAlt = part.title;
    }

    if (results[1].duration !== part.duration) {
      console.error(`Warning: Syllabus item part duration mismatch! (${part.title} => ${results[1].duration} !== ${part.duration})`);
    }

    if (part.type && results[1].type !== part.type) {
      console.error(`Warning: Syllabus item part type mismatch! (${part.title} => ${results[1].type} !== ${part.type})`);
    }

    return cb(null, Object.assign({}, part, results[1]));
  });
};


module.exports = (cwd, item, cb) => {

  if (!item.parts || !item.parts.length) {
    item.parts = [{
      order: 1,
      type: null,
      duration: item.duration,
      title: item.title,
      href: item.href
    }];
  }

  Async.map(item.parts, Async.apply(internals.parsePartFile, cwd), (err, results) => {

    if (err) {
      return cb(err);
    }

    return cb(null, Object.assign({}, item, { parts: results }));
  });
};
