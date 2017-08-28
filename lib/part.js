'use strict';


const Fs = require('fs');
const Path = require('path');
const Url = require('url');
const QueryString = require('querystring');
const Async = require('async');
const Marked = require('marked');
const Cheerio = require('cheerio');
const Common = require('./common');


const internals = {};


internals.isFile = (fname, cb) => Fs.exists(fname, (exists) => {
  if (!exists) {
    return cb(new Error(`File ${fname} doesnt exist!`));
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


internals.defaults = () => ({
  title: null,
  type: null,
  format: null,
  duration: null,
  learningObjectives: [],
  body: []
});


internals.parsePartLogistics = str => {
  const matches = /^(Formato|Tipo|Duración):\s+`(\d+(min|h)|(lectura|practice|workshop|quiz))`/.exec(str);

  if (!matches || matches.length < 3) {
    return {};
  }

  if (matches[1] === 'Formato') {
    return { format: matches[2] };
  }
  else if (matches[1] === 'Tipo') {
    return { type: matches[2] };
  }
  else if (matches[1] === 'Duración') {
    return { duration: Common.parseDuration(matches[2]) };
  }

  return {};
};


internals.parseImages = (cwd, part, body) => {
  const $ = Cheerio.load(body);

  $('img').each((i, el) => {
    const src = $(el).attr('src');

    if (/^(http|https):\/\//.test(src)) {
      return;
    }

    const courseDir = cwd.split('curricula-js')[1].replace(/^\//, '');
    const itemDir = part.href.split('/')[0];
    const prefix = `https://raw.githubusercontent.com/Laboratoria/curricula-js/master/${courseDir}/${itemDir}/`;

    $(el).attr('src', prefix + src);
  });

  return $('body').html();
};


internals.parseYouTubeVideos = (body) => {
  const $ = Cheerio.load(body);

  $('a').each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const urlObj = Url.parse(href);
    const qs = QueryString.parse(urlObj.query);

    if (urlObj.hostname !== 'www.youtube.com' || urlObj.pathname !== '/watch' || !qs.v) {
      return;
    }

    const iframe = $('<iframe id="ytplayer" type="text/html" width="640" height="360" frameborder="0">');
    iframe.attr('src', `http://www.youtube.com/embed/${qs.v}?autoplay=0`);

    const videoContainer = $('<div class="video-container">');
    videoContainer.append(iframe);
    $el.replaceWith(videoContainer);
  });

  return $('body').html();
};


internals.parsePartFile = (cwd, part, cb) => {
  console.log(part);
  if (!part || !part.href || !/\.md$/.test(part.href)) {
    return cb(null, part);
  }

  const fname = Path.join(cwd, part.href);

  Async.series([
    Async.apply(internals.isFile, fname),
    Async.apply(internals.parseFile, fname)
  ], (err, results) => {

    if (err) {
      console.log(err);
      return cb(null, part);
    }

    results[1].body = Common.tokensToHTML(results[1].body, []);
    results[1].body = internals.parseImages(cwd, part, results[1].body);
    results[1].body = internals.parseYouTubeVideos(results[1].body);


    if (results[1].learningObjectives && results[1].learningObjectives.length) {
      results[1].learningObjectives = Common.tokensToHTML(results[1].learningObjectives, []);
    }

    if (results[1].title !== part.title) {
      results[1].titleAlt = part.title;
    }

    if (results[1].duration && part.duration && results[1].duration !== part.duration) {
      console.error(`Warning: Syllabus item part duration mismatch! (${part.title} => ${results[1].duration} !== ${part.duration})`);
    }

    if (results[1].type && part.type && results[1].type !== part.type) {
      console.error(`Warning: Syllabus item part type mismatch! (${part.title} => ${results[1].type} !== ${part.type})`);
    }

    const notNullKeys = Object.keys(results[1]).reduce((memo, key) => {

      if (results[1][key]) {
        memo[key] = results[1][key];
      }

      return memo;
    }, {});

    return cb(null, Object.assign({}, part, notNullKeys));
  });
};


internals.tokensToPart = (currSection = 'title') => (memo, token) => {
  if (currSection === 'title' && token.type === 'heading' && token.depth === 1) {
    memo.title = token.text.replace(/^\d+\.\s/, '');
  }
  else if (currSection === 'title' && token.type === 'heading' && token.depth === 2 && /objetivos/i.test(token.text)) {
    currSection = 'learningObjectives';
  }
  else if (currSection === 'title' && (!memo.duration || !memo.format) && token.type === 'list_start') {
    currSection = 'logistics';
  }
  else if (currSection === 'logistics' && token.type === 'list_end') {
    currSection = 'body';
  }
  else if (currSection === 'logistics' && token.type === 'text') {
    Object.assign(memo, internals.parsePartLogistics(token.text));
  }
  else if (!memo.body.length && token.type === 'hr') {
    currSection = 'body';
  }
  else if (currSection !== 'logistics') {
    // Si llegados a este punto todavía estamos en la sección `title` es que el
    // archivo no contiene nada de metadata antes del `body` y no hay <hr>
    // explícito demarcando el body, así que saltamos a al body.
    if (currSection === 'title') {
      currSection = 'body';
    }
    memo[currSection].push(token);
  }

  return memo;
};


internals.parseHeader = (header, links) => {
  const { metaTokens } = header.reduce((memo, token) => {
    if (!memo.end) {
      memo.metaTokens.push(token);
    }
    if (token.type === 'list_end') {
      memo.end = true;
    }
    return memo;
  }, { metaTokens: [] });

  const html = Common.tokensToHTML(metaTokens, links);
  const $ = Cheerio.load(html);

  const obj = $('ul').first().children().map((i, el) => {
    const pair = $(el).text().split(':').map(item => item.trim().toLowerCase());
    if (['tipo', 'type'].indexOf(pair[0]) > -1) {
      return { type: pair[1] };
    }
    else if (['formato', 'format'].indexOf(pair[0]) > -1) {
      return { format: pair[1] };
    }
    else if (['duración', 'duration'].indexOf(pair[0]) > -1) {
      return { duration: pair[1] };
    }
  }).get().reduce((memo, item) => Object.assign(memo, item), {});

  return obj;
};


internals.parseReadme = (course, unitDir, partDir, data, cb) => {
  const slug = `${unitDir}/${partDir}`;
  const part = { unitDir, partDir };
  const tokens = Marked.lexer(data);
  //const parsed = tokens.reduce(internals.tokensToPart(), internals.defaults());

  if (!tokens.length) {
    course.logs.push(['error', `README.md de ${slug} está vacío!`]);
    return cb(null, part);
  }

  const titleToken = tokens.shift();

  if (titleToken.type !== 'heading' || titleToken.depth !== 1) {
    course.logs.push([
      'error',
      `README.md de ${slug} debe empezar con un h1 con el título del curso!`
    ]);
    return cb(null, part);
  }

  part.title = titleToken.text.replace(/^\d+\.\s/, '');

  const { header, body } = tokens.reduce((memo, token) => {
    if (token.type === 'hr') {
      memo.body = [];
    }
    else if (memo.body) {
      memo.body.push(token);
    }
    else {
      memo.header.push(token);
    }
    return memo;
  }, {
    header: [],
    body: null
  });

  if (header[0].type !== 'list_start' || header[0].ordered !== false) {
    course.logs.push([
      'error',
      `README.md de ${slug} debe incluir tipo, formato y duración!`
    ]);
    return cb(null, part);
  }

  Object.assign(part, internals.parseHeader(header, tokens.links));

  if (body) {
    part.body = Common.tokensToHTML(body, tokens.links);
    part.body = internals.parseYouTubeVideos(part.body);
    //part.body = internals.parseImages(cwd, part, part.body);
  }

  cb(null, part);
};


internals.readPartReadme = (course, unitDir, partDir, cb) => Fs.readFile(
	Path.join(course.path, unitDir, partDir, 'README.md'),
	'utf8',
	(err, data) =>
    (err && cb(err)) || internals.parseReadme(course, unitDir, partDir, data, cb)
);


module.exports = (course, unitDir) => (partDir, cb) => Fs.readdir(
	Path.join(course.path, unitDir, partDir),
	(err, files) => {
		if (err) {
			return cb(err);
		}
		if (files.indexOf('README.md') === -1) {
			course.logs.push(['warn', `Part ${unitDir}/${partDir} is missing README.md`]);
			return cb(null, { unitDir, partDir });
		}
		internals.readPartReadme(course, unitDir, partDir, cb);
	}
);
