'use strict';


const Fs = require('fs');
const Path = require('path');
const Marked = require('marked');
const Common = require('./common');


const internals = {};


internals.defaults = () => ({
  title: null,
  description: [],
  tags: [],
  targetAudience: [],
  dependencies: [],
  learningObjectives: [],
  logistics: [],
  product: [],
  syllabus: [],
  contributors: [],
  books: [],
  benchmarks: [],
  references: []
});


internals.parseSyllabusItemPartTitle = str => {

  const matches = /^\[(.*)\]\((.*)\)$/.exec(str);

  if (!matches || matches.length < 3) {
    return { title: str };
  }

  return { title: matches[1], href: matches[2] };
};


internals.parseSyllabusItemDuration = str => {

  /*
  15min (presencial)
  1h (presencial)
  1.5h (self-paced)
  */
  const matches = /^([0-9\.\-]+(h|hrs|min))\s+\((presencial|self-paced)\)$/.exec(str);

  if (!matches) {
    throw new Error(`Syllabus item first paragraph must be duration string, ie: 15min (presencial), got ${str}`);
  }

  return {
    duration: Common.parseDuration(matches[1]),
    format: matches[3]
  };
};


internals.parseSyllabusItemTitle = str => {

  const matches = /^(\[BONUS\]\s+)?(((Lección|Lesson|Workshop)\s+\d+):?\s+)?(\[.*\])(\(.*\)).*$/.exec(str);

  if (!matches || matches.length < 7) {
    return {};
  }

  let type = 'other';
  if (matches[4] === 'Lección' || matches[4] === 'Lesson') {
    type = 'lesson';
  }
  else if (matches[4] === 'Workshop') {
    type = 'workshop';
  }

  return {
    type,
    title: matches[5].slice(1, matches[5].length - 1),
    href: matches[6].slice(1, matches[6].length - 1),
    bonus: !!matches[1]
  };
};


internals.parseSyllabus = (tokens, links) => tokens
  .reduce((memo, token) => {

    if (token.type === 'heading' && token.depth === 3) {
      memo.push(Object.assign({}, internals.parseSyllabusItemTitle(token.text), {
        format: null,
        duration: null,
        description: [],
        parts: null
      }));
    }
    else if (token.type === 'paragraph' && !memo[memo.length - 1].duration) {
      const { duration, format } = internals.parseSyllabusItemDuration(token.text);
      memo[memo.length - 1].duration = duration;
      memo[memo.length - 1].format = format;
    }
    else if (token.type === 'heading' && token.depth === 4 && token.text === 'Lesson plan') {
      memo[memo.length - 1].parts = [];
    }
    else if (token.type === 'table') {
      memo[memo.length - 1].parts = token.cells.map(row => {
        return Object.assign({}, {
          order: parseInt(row[0], 10),
          type: row[1],
          duration: Common.parseDuration(row[2])
        }, internals.parseSyllabusItemPartTitle(row[3]));
      });
    }
    else {
      memo[memo.length - 1].description.push(token);
    }

    return memo;
  }, [])
  .map(item => Object.assign({}, item, {
    description: Common.parseTokens(item.description, links)
  }));


internals.tokensToCourse = (currSection = 'title') => (memo, token) => {

  if (token.type === 'heading') {
    if (token.depth === 1) {
      memo.title = token.text.replace(/^\d+\.\s/, '');
      currSection = 'description';
    }
    else if (token.depth === 2) {
      if (/Público objetivo/i.test(token.text)) {
        currSection = 'targetAudience';
      }
      else if (token.text === 'Requerimientos previos') {
        currSection = 'dependencies';
      }
      else if (token.text === 'Aprenderás') {
        currSection = 'learningObjectives';
      }
      else if (token.text === 'Detalles logísticos' || token.text === 'Duración') {
        currSection = 'logistics';
      }
      else if (/(producto|proyecto)/i.test(token.text)) {
        currSection = 'product';
      }
      else if (token.text === 'Syllabus') {
        currSection = 'syllabus';
      }
      else if (/(Contributors|Autor|Colaborador)/i.test(token.text)) {
        currSection = 'contributors';
      }
      else if (/(Libros|Books)/i.test(token.text)) {
        currSection = 'books';
      }
      else if (/(benchmarks)/i.test(token.text)) {
        currSection = 'benchmarks';
      }
      else if (/(referencias|lecturas complementarias)/i.test(token.text)) {
        currSection = 'references';
      }
      else {
        memo[currSection].push(token);
      }
    }
    else {
      memo[currSection].push(token);
    }
  }
  else {
    memo[currSection].push(token);
  }

  return memo;
};


module.exports = (cwd, cb) => {

  Fs.readFile(Path.join(cwd, 'README.md'), 'utf8', (err, data) => {

    if (err) {
      return cb(err);
    }

    const tokens = Marked.lexer(data);
    const course = tokens
      .reduce(internals.tokensToCourse(), internals.defaults());

    const parsed = Object.keys(course).reduce((memo, key) => {

      if (key === 'title') {
        memo[key] = course[key];
      }
      else if (key === 'syllabus') {
        memo[key] = internals.parseSyllabus(course[key], tokens.links);
      }
      else {
        memo[key] = Common.parseTokens(course[key], tokens.links);
      }
      return memo;
    }, {});

    cb(null, parsed);
  });
};
