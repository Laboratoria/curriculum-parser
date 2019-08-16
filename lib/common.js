const path = require('path');
const queryString = require('querystring');
const url = require('url');
const marked = require('marked');
const cheerio = require('cheerio');


const internals = {};


internals.parseMeta = (headerTokens, metaKeys, links) => {
  if (!headerTokens || !headerTokens.length) {
    return {};
  }

  const { metaTokens } = headerTokens.reduce((memo, token) => {
    if (!memo.end) {
      memo.metaTokens.push(token);
    }
    if (token.type === 'list_end') {
      return { ...memo, end: true };
    }
    return memo;
  }, { metaTokens: [], end: false });

  const html = exports.tokensToHTML(metaTokens, links);
  const $ = cheerio.load(html);

  return $('ul').first().children().map((i, el) => {
    const pair = $(el).text().split(':').map(item => item.trim().toLowerCase());
    if (metaKeys[pair[0]]) {
      return { [metaKeys[pair[0]]]: pair[1] };
    }
    return undefined;
  })
    .get()
    .reduce((memo, item) => Object.assign(memo, item), {});
};


internals.splitReadmeTokens = tokens => tokens.reduce((memo, token) => {
  if (token.type === 'hr' && !memo.bodyTokens) {
    return { ...memo, bodyTokens: [] };
  }
  if (memo.bodyTokens) {
    return { ...memo, bodyTokens: [...memo.bodyTokens, token] };
  }
  return { ...memo, headerTokens: [...memo.headerTokens, token] };
}, {
  headerTokens: [],
  bodyTokens: null,
});


internals.replaceLinkWithIframe = ($, $el, iframe) => {
  const container = $('<div class="iframe-container">');
  container.append(iframe);
  $el.replaceWith(container);
};


// <iframe width="560" height="315" src="https://www.youtube.com/embed/4A2mWqLUpzw" frameborder="0" gesture="media" allow="encrypted-media" allowfullscreen></iframe>
internals.youtubeLinkToEmbed = ($, $el, { v, ...qs }) => {
  const params = queryString.stringify({ ...qs, autoplay: 0 });
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


internals.vimeoLinkToEmbed = ($, $el, { v }) => {
  const iframe = $('<iframe  width="640" height="360" frameborder="0">');
  iframe.attr('src', `https://player.vimeo.com/video/${v}?title=0&byline=0&portrait=0`);
  iframe.attr('scrolling', 'no');
  iframe.attr('allowfullscreen', true);
  iframe.attr('mozallowfullscreen', true);
  iframe.attr('webkitallowfullscreen', true);

  internals.replaceLinkWithIframe($, $el, iframe);
};


internals.loomLinkToEmbed = ($, $el, { v }) => {
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


internals.soundcloudLinkToEmbed = ($, $el, { a }) => {
  const iframe = $('<iframe width="640" height="180" frameborder="0">');
  iframe.attr('src', `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${a}`);
  iframe.attr('allow', 'autoplay');
  iframe.attr('scrolling', 'no');

  internals.replaceLinkWithIframe($, $el, iframe);
};


internals.gSlidesLinkToEmbed = ($, $el, { d }) => {
  const iframe = $('<iframe width="640" height="360" frameborder="0">');
  iframe.attr('src', `https://docs.google.com/presentation/d/e/${d}`);
  iframe.attr('allowfullscreen', true);
  iframe.attr('mozallowfullscreen', true);
  iframe.attr('webkitallowfullscreen', true);

  internals.replaceLinkWithIframe($, $el, iframe);
};


internals.parseLinks = (body) => {
  const $ = cheerio.load(body);
  const embeds = [];
  const addEmbed = (type, provider, href, id) => embeds.push({
    type,
    provider,
    href,
    id,
  });

  $('a').each((i, el) => {
    const $el = $(el);
    const href = $el.attr('href');
    const urlObj = url.parse(href);
    const qs = queryString.parse(urlObj.query);


    if (urlObj.hostname === 'www.youtube.com' && urlObj.pathname === '/watch' && qs.v) {
      addEmbed('video', 'youtube', href, qs.v);
      return internals.youtubeLinkToEmbed($, $el, qs);
    }

    // https://youtu.be/ft5TzxG-LAc
    if (urlObj.hostname === 'youtu.be') {
      addEmbed('video', 'youtube', href, urlObj.pathname.slice(1));
      return internals.youtubeLinkToEmbed($, $el, {
        ...qs,
        v: urlObj.pathname.slice(1),
      });
    }

    if (/^.+\.wistia\.com$/.test(urlObj.hostname)) {
      addEmbed('video', 'wistia', href, qs.wvideo);
      return internals.wistiaLinkToEmbed($, $el, qs);
    }

    // (https://www.useloom.com/share/9829eb5e520a4ee69e2b915f2d388e30)
    if (urlObj.hostname === 'www.useloom.com' && /share/.test(urlObj.pathname)) {
      addEmbed('video', 'loom', href, urlObj.pathname.slice(7));
      return internals.loomLinkToEmbed($, $el, {
        ...qs,
        v: urlObj.pathname.slice(7),
      });
    }

    // https://vimeo.com/90215988
    if (urlObj.hostname === 'vimeo.com') {
      addEmbed('video', 'vimeo', href, urlObj.pathname.slice(1));
      return internals.vimeoLinkToEmbed($, $el, {
        ...qs,
        v: urlObj.pathname.slice(1),
      });
    }

    // https://laboratoria.typeform.com/to/LvMhu8
    if (/^.+\.typeform\.com$/.test(urlObj.hostname)) {
      addEmbed('form', 'typeform', href, urlObj.pathname.slice(4));
      return internals.typeformLinkToEmbed($, $el, {
        ...qs,
        v: urlObj.pathname.slice(4),
        subdomain: urlObj.hostname.split('.')[0],
      });
    }

    // https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/332779915
    if (urlObj.hostname === 'api.soundcloud.com' && /tracks/.test(urlObj.pathname)) {
      addEmbed('audio', 'soundcloud', href, urlObj.pathname.slice(8));
      return internals.soundcloudLinkToEmbed($, $el, {
        a: urlObj.pathname.slice(8),
      });
    }

    // https://docs.google.com/presentation/d/e/2PACX-1vQNfujXzw2FrZGyQGp2T86t9EqZAF1-w1jTsyNvhAjj_eyqOPSHKjplVqJBYT1YgCy0SB80vcm1xl59/embed?start=false&loop=false&delayms=3000"
    if (urlObj.hostname === 'docs.google.com' && /presentation/.test(urlObj.pathname)) {
      addEmbed('slides', 'google', href, urlObj.pathname.slice(18));
      return internals.gSlidesLinkToEmbed($, $el, {
        d: urlObj.pathname.slice(18),
      });
    }

    // Open external links in target=_blank
    if (urlObj.protocol) {
      $el.attr('target', '_blank');
    }

    return undefined;
  });

  return { body: $('body').html(), embeds };
};


internals.isMetaListToken = token => (
  token.type === 'list_start' && token.ordered === false
);


// Public API


exports.hasOwnProperty = (obj, propName) => (
  Object.prototype.hasOwnProperty.call(obj, propName)
);


exports.omit = (obj, omitKeys) => Object.keys(obj).reduce(
  (memo, key) => (
    (omitKeys.indexOf(key) === -1)
      ? { ...memo, [key]: obj[key] }
      : memo
  ),
  {},
);


exports.isDirname = file => /^\d{2}-/.test(file);


exports.parseDirname = (dir) => {
  let slug = path.dirname(dir).split('/').pop();
  let order = 0;
  const matches = /^(\d{2})-/.exec(slug);
  if (matches && matches.length > 1) {
    slug = slug.slice(3);
    order = parseInt(matches[1], 10);
  }
  return { slug, order };
};


exports.parseDuration = (str) => {
  const matches = /^(\d+(\.\d+)?)\s*(m|min|h)?$/.exec(str);

  if (!matches || matches.length < 4) {
    return null;
  }

  if (matches[3] === 'h') {
    return parseInt(parseFloat(matches[1], 10) * 60, 10);
  }

  return parseInt(matches[1], 10);
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

  return marked.parser(t);
};


//
// README.md parser
//
exports.parseReadme = (data, metaKeys = {}) => {
  const tokens = marked.lexer(data || '');

  if (!tokens.length) {
    throw new Error('README.md está vacío!');
  }

  if (tokens[0].type !== 'heading' || tokens[0].depth !== 1) {
    throw new Error('README.md debe empezar con un h1 con el título!');
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

  const {
    body,
    embeds,
  } = internals.parseLinks(exports.tokensToHTML(bodyTokens, tokens.links));

  if (embeds && embeds.length) {
    Object.assign(meta, { embeds });
  }

  return Object.assign({ title }, meta, { body });
};


exports.getReadmeFileName = locale => (
  (!locale || locale.slice(0, 2) === 'es')
    ? 'README.md'
    : `README.${locale}.md`
);
