'use strict';


const Fs = require('fs');
const Path = require('path');
const Marked = require('marked');
const Cheerio = require('cheerio');
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


// internals.parseSyllabusItemDuration = str => {
//   /*
//   15min (presencial)
//   1h (presencial)
//   1.5h (self-paced)
//   */
//   const matches = /^([0-9\.\-]+(h|hrs|min))\s+\((presencial|self-paced)\)$/.exec(str);
//
//   if (!matches) {
//     throw new Error(`Syllabus item first paragraph must be duration string, ie: 15min (presencial), got ${str}`);
//   }
//
//   return {
//     duration: Common.parseDuration(matches[1]),
//     format: matches[3]
//   };
// };


internals.parseSyllabusItemTitle = str => {
  const matches = /^(\[BONUS\]\s+)?(((Unidad|Unit)\s+\d+):?\s+)?(\[.*\])(\(.*\)).*$/.exec(str);

  if (!matches || matches.length < 7) {
    return {};
  }

  return {
    title: matches[5].slice(1, matches[5].length - 1),
    href: matches[6].slice(1, matches[6].length - 1),
    bonus: !!matches[1]
  };
};


internals.parseSyllabus = (tokens, links) => tokens
  .reduce((memo, token) => {
    if (token.type === 'heading' && token.depth === 3) {
      memo.push(Object.assign({}, internals.parseSyllabusItemTitle(token.text), {
        // format: null,
        // duration: null,
        description: [],
        parts: []
      }));
    }
    // else if (token.type === 'paragraph' && memo.length && !memo[memo.length - 1].duration) {
    //   const { duration, format } = internals.parseSyllabusItemDuration(token.text);
    //   memo[memo.length - 1].duration = duration;
    //   memo[memo.length - 1].format = format;
    // }
    // else if (token.type === 'heading' && token.depth === 4 && token.text === 'Lesson plan') {
    //   memo[memo.length - 1].parts = [];
    // }
    else if (token.type === 'table') {
      memo[memo.length - 1].parts = token.cells.map(row => {
        return Object.assign({}, {
          order: parseInt(row[0], 10),
          type: row[1],
          format: row[2],
          duration: Common.parseDuration(row[3])
        }, internals.parseSyllabusItemPartTitle(row[4]));
      });
    }
    else {
      memo[memo.length - 1].description.push(token);
    }

    return memo;
  }, [])
  .map(item => Object.assign({}, item, {
    description: Common.tokensToHTML(item.description, links)
  }));


internals.parseTokens = (result, currSection = 'title') => (memo, token) => {
  if (token.type === 'heading') {
    if (token.depth === 1) {
      memo.title = token.text;
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


internals.parseDirname = path => {
  let slug = Path.dirname(path).split('/').pop();
  let order = 0;
  const matches = /^(\d{2})\-/.exec(slug);
  if (matches && matches.length > 1) {
    slug = slug.slice(3);
    order = parseInt(matches[1], 10);
  }
  return { slug, order };
};


internals.parseDescription = (tokens, links) => {
  let description = Common.tokensToHTML(tokens, links);
  const tags = { primary: [], secondary: [] };
  const $ = Cheerio.load(description);
  let $lastP = $('p').last();

  if (/^Secondary tags\:/.test($lastP.text())) {
    tags.secondary = $lastP.find('code').toArray().map(el => $(el).text());
    $lastP.remove();
    $lastP = $('p').last();
  }

  if (/^(Tags|Main tags)\:/.test($lastP.text())) {
    tags.primary = $lastP.find('code').toArray().map(el => $(el).text());
    $lastP.remove();
  }

  description = $('body').html();

  return { description, tags };
};


internals.readFile = (path, opts, cb) => Fs.readFile(path, 'utf8', (err, data) => {
  if (err) {
    return cb(err);
  }

  const { slug, order } = internals.parseDirname(path);
  const tokens = Marked.lexer(data);

  const result = {
    path,
    slug,
    order,
    logs: []
  };

  if (!tokens.length) {
    result.logs.push(['error', `README.md del curso ${slug} está vacío!`]);
    return cb(null, result);
  }

  if (tokens[0].type !== 'heading' || tokens[0].depth !== 1) {
    result.logs.push([
      'error',
      `README.md del curso ${slug} debe empezar con un h1 con el título del curso!`
    ]);
    return cb(null, result);
  }

  const parsed = tokens.reduce(
    internals.parseTokens(result),
    internals.defaults()
  );

  result.parsed = Object.keys(parsed).reduce((memo, key) => {
    if (key === 'title') {
      memo[key] = parsed[key];
    }
    else if (key === 'description') {
      const { description, tags } = internals.parseDescription(parsed[key], tokens.links);
      memo[key] = description;
      memo.tags = tags;
    }
    else if (key === 'syllabus') {
      memo[key] = internals.parseSyllabus(parsed[key], tokens.links);
    }
    else if (key !== 'tags') {
      memo[key] = Common.tokensToHTML(parsed[key], tokens.links);
    }
    return memo;
  }, {});

  cb(null, result);
});



//
// Public API
//
module.exports = (path, opts, cb) =>
  (typeof opts === 'function') ?
    internals.readFile(path, {}, opts) : internals.readFile(path, opts, cb);
