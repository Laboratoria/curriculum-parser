'use strict';


const Path = require('path');
const Marked = require('marked');


exports.omit = (obj, omitKeys) => Object.keys(obj).reduce((memo, key) => {
  if (omitKeys.indexOf(key) === -1) {
    memo[key] = obj[key];
  }
  return memo;
}, {});


exports.isDirname = file => /^\d{2}\-/.test(file);


exports.parseDirname = path => {
  let slug = Path.dirname(path).split('/').pop();
  let order = 0;
  const matches = /^(\d{2})\-/.exec(slug);
  if (matches && matches.length > 1) {
    slug = slug.slice(3);
    order = parseInt(matches[1], 10);
  }
  return { slug, order };
};


exports.parseDuration = str => (str[str.length - 1] === 'h') ?
  parseInt(str.slice(0, -1), 10) * 60 : parseInt(str.slice(0, -3), 10);


exports.tokensToHTML = (tokens, links) => {
  const t = tokens.slice(0);
  t.links = links;
  return Marked.parser(t);
};
