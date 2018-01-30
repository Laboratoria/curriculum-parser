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


exports.parseDuration = str => {
  const matches = /^(\d+(\.\d+)?)\s*(m|min|h)?$/.exec(str);

  if (!matches || matches.length < 4) {
    return null;
  }

  if (matches[3] === 'h') {
    return parseInt(parseFloat(matches[1], 10) * 60);
  }

  return parseInt(matches[1], 10);;
};


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


internals.replaceLinkWithIframe = ($, $el, iframe) => {
  const videoContainer = $('<div class="video-container">');
  videoContainer.append(iframe);
  $el.replaceWith(videoContainer);
};


// <iframe width="560" height="315" src="https://www.youtube.com/embed/4A2mWqLUpzw" frameborder="0" gesture="media" allow="encrypted-media" allowfullscreen></iframe>
internals.youtubeLinkToEmbed = ($, $el, { v, ...qs }) => {
  const params = QueryString.stringify({ ...qs, autoplay: 0 });
  const iframe = $('<iframe id="ytplayer" type="text/html" width="640" height="360" frameborder="0">');
  iframe.attr('src', `https://www.youtube.com/embed/${v}?${params}`);

  internals.replaceLinkWithIframe($, $el, iframe);
};


internals.wistiaLinkToEmbed = ($, $el, qs) => {
  const iframe = $('<iframe frameborder="0">');
  iframe.attr('src', `//fast.wistia.net/embed/iframe/${qs.wvideo}?videoFoam=true`);
  iframe.attr('allowtransparency', 'true');
  iframe.attr('scrolling', 'no');
  iframe.attr('allowfullscreen', true);
  iframe.attr('mozallowfullscreen', true);
  iframe.attr('webkitallowfullscreen', true);
  iframe.attr('oallowfullscreen', true);
  iframe.attr('msallowfullscreen', true);
  iframe.attr('width', '100%');
  iframe.attr('height', '100%');

  internals.replaceLinkWithIframe($, $el, iframe);
};


internals.vimeoLinkToEmbed = ($, $el, { v, ...qs }) => {
  const iframe = $('<iframe  width="640" height="360" frameborder="0">');
  iframe.attr('src', `https://player.vimeo.com/video/${v}?title=0&byline=0&portrait=0`);
  iframe.attr('scrolling', 'no');
  iframe.attr('allowfullscreen', true);
  iframe.attr('mozallowfullscreen', true);
  iframe.attr('webkitallowfullscreen', true);

  internals.replaceLinkWithIframe($, $el, iframe);
};


internals.loomLinkToEmbed = ($, $el, { v, ...qs }) => {
  const iframe = $('<iframe  width="640" height="360" frameborder="0">');
  iframe.attr('src', `https://www.useloom.com/embed/${v}`);
  iframe.attr('allowfullscreen', true);
  iframe.attr('mozallowfullscreen', true);
  iframe.attr('webkitallowfullscreen', true);

  internals.replaceLinkWithIframe($, $el, iframe);
};


internals.typeformLinkToEmbed = ($, $el, qs) => {
  const iframe = $('<iframe frameborder="0" width="100%" height="100%">');
  iframe.css({ height: '100vh' });
  iframe.attr('src', `https://${qs.subdomain}.typeform.com/to/${qs.v}`);
  iframe.attr('allowfullscreen', true);
  iframe.attr('mozallowfullscreen', true);
  iframe.attr('webkitallowfullscreen', true);

  $el.replaceWith(iframe);
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

    // https://youtu.be/ft5TzxG-LAc
    if (urlObj.hostname === 'youtu.be') {
      return internals.youtubeLinkToEmbed($, $el, {
        ...qs,
        v: urlObj.pathname.slice(1),
      });
    }

    if (/^.+\.wistia\.com$/.test(urlObj.hostname)) {
      return internals.wistiaLinkToEmbed($, $el, qs);
    }

    // (https://www.useloom.com/share/9829eb5e520a4ee69e2b915f2d388e30)
    if (urlObj.hostname === 'www.useloom.com' && /share/.test(urlObj.pathname) ){
      return internals.loomLinkToEmbed($, $el,  {
        ...qs,
        v: urlObj.pathname.slice(7),
      });
    }

    //https://vimeo.com/90215988
    if (urlObj.hostname === 'vimeo.com'){
      return internals.vimeoLinkToEmbed($, $el, {
        ...qs,
        v: urlObj.pathname.slice(1),
      });
    }

    // https://laboratoria.typeform.com/to/LvMhu8?email=xxxxx&fname=xxxxx&city=xxxxx
    if (/^.+\.typeform\.com$/.test(urlObj.hostname)) {
      return internals.typeformLinkToEmbed($, $el, {
        ...qs,
        v: urlObj.pathname.slice(4),
        subdomain: urlObj.hostname.split('.')[0],
      });
    }

    // Open external links in target=_blank
    if (urlObj.protocol) {
      $el.attr('target', '_blank');
    }
  });

  return $('body').html();
};


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
  ].reduce(
    (memo, fn) => fn(memo),
    exports.tokensToHTML(bodyTokens, tokens.links)
  );

  return Object.assign({ title }, meta, { body });
};
