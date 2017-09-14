'use strict';


const Path = require('path');
const QueryString = require('querystring');
const Url = require('url');
const Marked = require('marked');
const Cheerio = require('cheerio');


const internals = {};


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

  // Trim <hr>
  if (t.length && t[t.length - 1] && t[t.length - 1].type === 'hr') {
    t.splice(t.length - 1, 1);
  }

  if (t.length && t[0] && t[0].type === 'hr') {
    t.splice(0, 1);
  }

  return Marked.parser(t);
};


//
// README.md parser
//


internals.parseMeta = (headerTokens, metaKeys, links) => {
  if (!headerTokens || !headerTokens.length) {
    return {};
  }

  const { metaTokens } = headerTokens.reduce((memo, token) => {
    if (!memo.end) {
      memo.metaTokens.push(token);
    }
    if (token.type === 'list_end') {
      memo.end = true;
    }
    return memo;
  }, { metaTokens: [] });

  const html = exports.tokensToHTML(metaTokens, links);
  const $ = Cheerio.load(html);

  return $('ul').first().children().map((i, el) => {
    const pair = $(el).text().split(':').map(item => item.trim().toLowerCase());
    if (metaKeys[pair[0]]) {
      return { [metaKeys[pair[0]]]: pair[1] };
    }
  }).get().reduce((memo, item) => Object.assign(memo, item), {});
};


internals.splitReadmeTokens = tokens => tokens.reduce((memo, token) => {
  if (token.type === 'hr' && !memo.bodyTokens) {
    memo.bodyTokens = [];
  }
  else if (memo.bodyTokens) {
    memo.bodyTokens.push(token);
  }
  else {
    memo.headerTokens.push(token);
  }
  return memo;
}, {
  headerTokens: [],
  bodyTokens: null
});


internals.youtubeLinkToEmbed = ($, $el, qs) => {
  const iframe = $('<iframe id="ytplayer" type="text/html" width="640" height="360" frameborder="0">');
  iframe.attr('src', `https://www.youtube.com/embed/${qs.v}?autoplay=0`);

  const videoContainer = $('<div class="video-container">');
  videoContainer.append(iframe);
  $el.replaceWith(videoContainer);
};


internals.parseLinks = (body) => {
  const $ = Cheerio.load(body);

  $('a').each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const urlObj = Url.parse(href);
    const qs = QueryString.parse(urlObj.query);

    if (urlObj.hostname === 'www.youtube.com' && urlObj.pathname === '/watch' && qs.v) {
      return internals.youtubeLinkToEmbed($, $el, qs);
    }

    // Open external links in target=_blank
    if (urlObj.protocol) {
      $el.attr('target', '_blank');
    }
  });

  return $('body').html();
};


// internals.parseImages = (cwd, part, body) => {
//   const $ = Cheerio.load(body);
//
//   $('img').each((i, el) => {
//     const src = $(el).attr('src');
//
//     if (/^(http|https):\/\//.test(src)) {
//       return;
//     }
//
//     const courseDir = cwd.split('curricula-js')[1].replace(/^\//, '');
//     const itemDir = part.href.split('/')[0];
//     const prefix = `https://raw.githubusercontent.com/Laboratoria/curricula-js/master/${courseDir}/${itemDir}/`;
//
//     $(el).attr('src', prefix + src);
//   });
//
//   return $('body').html();
// };


// internals.parseYouTubeVideos = (body) => {
//   const $ = Cheerio.load(body);
//
//   $('a').each((i, el) => {
//     const $el = $(el);
//     const href = $el.attr('href');
//     const urlObj = Url.parse(href);
//     const qs = QueryString.parse(urlObj.query);
//
//     if (urlObj.hostname !== 'www.youtube.com' || urlObj.pathname !== '/watch' || !qs.v) {
//       return;
//     }
//
//     const iframe = $('<iframe id="ytplayer" type="text/html" width="640" height="360" frameborder="0">');
//     iframe.attr('src', `http://www.youtube.com/embed/${qs.v}?autoplay=0`);
//
//     const videoContainer = $('<div class="video-container">');
//     videoContainer.append(iframe);
//     $el.replaceWith(videoContainer);
//   });
//
//   return $('body').html();
// };


internals.isMetaListToken = token =>
  token.type === 'list_start' && token.ordered === false;


exports.parseReadme = (data, metaKeys={}) => {
  const tokens = Marked.lexer(data || '');

  if (!tokens.length) {
    throw new Error(`README.md está vacío!`)
  }

  if (tokens[0].type !== 'heading' || tokens[0].depth !== 1) {
    throw new Error(`README.md debe empezar con un h1 con el título!`);
  }

  const title = tokens[0].text.replace(/^\d+\.\s/, '');

  let { headerTokens, bodyTokens } = internals.splitReadmeTokens(tokens.slice(1));

  if (!Object.keys(metaKeys).length || !internals.isMetaListToken(headerTokens[0])) {
    bodyTokens = headerTokens.concat(bodyTokens);
    headerTokens = [];
  }

  const meta = internals.parseMeta(headerTokens, metaKeys, tokens.links);

  if (!bodyTokens || !bodyTokens.length) {
    return Object.assign({ title }, meta);
  }

  const body = [
    internals.parseLinks,
    // internals.parseYouTubeVideos,
    // internals.parseImages(cwd);
  ].reduce(
    (memo, fn) => fn(memo),
    exports.tokensToHTML(bodyTokens, tokens.links)
  );

  return Object.assign({ title }, meta, { body });
};
