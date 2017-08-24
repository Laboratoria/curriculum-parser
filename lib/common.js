'use strict';


const Marked = require('marked');


exports.parseDuration = str => (str[str.length - 1] === 'h') ?
  parseInt(str.slice(0, -1), 10) * 60 : parseInt(str.slice(0, -3), 10);


exports.tokensToHTML = (tokens, links) => {
  const t = tokens.slice(0);
  t.links = links;
  return Marked.parser(t);
};
