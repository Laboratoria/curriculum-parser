const path = require('path');
const queryString = require('querystring');
const url = require('url');
const marked = require('marked');
const { JSDOM } = require('jsdom');


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
  const { window } = new JSDOM(html);
  const { document } = window;
  return [...document.querySelector('ul').children].reduce(
    (memo, el) => {
      const [key, value] = el.textContent.split(':').map(
        item => item.trim().toLowerCase(),
      );
      return (metaKeys[key])
        ? { ...memo, [metaKeys[key]]: value }
        : memo;
    },
    {},
  );
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


const linkProviders = [
  {
    id: 'youtube',
    test: (urlObj, qs) => (
      urlObj.hostname === 'youtu.be'
      || (
        urlObj.hostname === 'www.youtube.com'
        && urlObj.pathname === '/watch'
        && qs.v
      )
    ),
    getObject: (a, urlObj, qs) => ({
      type: 'video',
      provider: 'youtube',
      href: a.href,
      id: urlObj.hostname === 'youtu.be' ? urlObj.pathname.slice(1) : qs.v,
    }),
    getElement: (document, a, urlObj, { v, ...qs }) => {
      const videoId = urlObj.hostname === 'youtu.be' ? urlObj.pathname.slice(1) : v;
      const params = queryString.stringify({ ...qs, autoplay: 0 });
      const el = Object.assign(document.createElement('iframe'), {
        width: 640,
        height: 360,
        src: `https://www.youtube.com/embed/${videoId}?${params}`,
        frameBorder: '0',
      });
      el.setAttribute('gesture', 'media');
      el.setAttribute('allow', 'encrypted-media');
      el.setAttribute('allowfullscreen', 'true');
      return el;
    },
  },
  {
    id: 'vimeo',
    test: urlObj => urlObj.hostname === 'vimeo.com',
    getObject: (a, urlObj) => ({
      type: 'video',
      provider: 'vimeo',
      href: a.href,
      id: urlObj.pathname.slice(1),
    }),
    getElement: (document, a, urlObj) => {
      const videoId = urlObj.pathname.slice(1);
      const el = Object.assign(document.createElement('iframe'), {
        width: 640,
        height: 360,
        src: `https://player.vimeo.com/video/${videoId}?title=0&byline=0&portrait=0`,
        frameBorder: '0',
        scrolling: 'no',
      });
      el.setAttribute('allowfullscreen', 'true');
      el.setAttribute('mozallowfullscreen', 'true');
      el.setAttribute('webkitallowfullscreen', 'true');
      return el;
    },
  },
  {
    id: 'loom',
    test: urlObj => urlObj.hostname === 'www.useloom.com' && /share/.test(urlObj.pathname),
    getObject: (a, urlObj) => ({
      type: 'video',
      provider: 'loom',
      href: a.href,
      id: urlObj.pathname.slice(7),
    }),
    getElement: (document, a, urlObj) => {
      const videoId = urlObj.pathname.slice(7);
      const el = Object.assign(document.createElement('iframe'), {
        width: 640,
        height: 360,
        src: `https://www.useloom.com/embed/${videoId}`,
        frameBorder: '0',
        scrolling: 'no',
      });
      el.setAttribute('allowfullscreen', 'true');
      el.setAttribute('mozallowfullscreen', 'true');
      el.setAttribute('webkitallowfullscreen', 'true');
      return el;
    },
  },
  {
    id: 'typeform',
    test: urlObj => /^.+\.typeform\.com$/.test(urlObj.hostname),
    getObject: (a, urlObj) => ({
      type: 'form',
      provider: 'typeform',
      href: a.href,
      id: urlObj.pathname.slice(4),
    }),
    getElement: (document, a, urlObj) => {
      const el = Object.assign(document.createElement('iframe'), {
        width: '100%',
        height: '100%',
        src: `https://${urlObj.hostname.split('.')[0]}.typeform.com/to/${urlObj.pathname.slice(4)}`,
        frameBorder: '0',
      });
      el.setAttribute('allowfullscreen', 'true');
      el.setAttribute('mozallowfullscreen', 'true');
      el.setAttribute('webkitallowfullscreen', 'true');
      el.style.height = '100vh';
      return el;
    },
  },
  {
    id: 'soundcloud',
    test: urlObj => urlObj.hostname === 'api.soundcloud.com' && /tracks/.test(urlObj.pathname),
    getObject: (a, urlObj) => ({
      type: 'audio',
      provider: 'soundcloud',
      href: a.href,
      id: urlObj.pathname.slice(8),
    }),
    getElement: (document, a, urlObj) => {
      const el = Object.assign(document.createElement('iframe'), {
        width: 640,
        height: 180,
        src: `https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/${urlObj.pathname.slice(8)}`,
        frameBorder: '0',
        scrolling: 'no',
      });
      el.setAttribute('allow', 'autoplay');
      return el;
    },
  },
  {
    id: 'google',
    test: urlObj => urlObj.hostname === 'docs.google.com' && /presentation/.test(urlObj.pathname),
    getObject: (a, urlObj) => ({
      type: 'slides',
      provider: 'google',
      href: a.href,
      id: urlObj.pathname.slice(18),
    }),
    getElement: (document, a, urlObj) => {
      const el = Object.assign(document.createElement('iframe'), {
        width: 640,
        height: 360,
        src: `https://docs.google.com/presentation/d/e/${urlObj.pathname.slice(18)}`,
        frameBorder: '0',
        scrolling: 'no',
      });
      el.setAttribute('allowfullscreen', 'true');
      el.setAttribute('mozallowfullscreen', 'true');
      el.setAttribute('webkitallowfullscreen', 'true');
      return el;
    },
  },
  {
    id: 'wistia',
    test: urlObj => /^.+\.wistia\.com$/.test(urlObj.hostname),
    getObject: (a, urlObj, qs) => ({
      type: 'video',
      provider: 'wistia',
      href: a.href,
      id: qs.wvideo,
    }),
    getElement: (document, a, urlObj, qs) => {
      const el = Object.assign(document.createElement('iframe'), {
        width: '100%',
        height: '100%',
        src: `//fast.wistia.net/embed/iframe/${qs.wvideo}?videoFoam=true`,
        frameBorder: '0',
        scrolling: 'no',
      });
      el.setAttribute('allowfullscreen', 'true');
      el.setAttribute('mozallowfullscreen', 'true');
      el.setAttribute('webkitallowfullscreen', 'true');
      el.setAttribute('oallowfullscreen', 'true');
      el.setAttribute('msallowfullscreen', 'true');

      el.setAttribute('allowtransparency', 'true');
      return el;
    },
  },
  {
    id: 'default-external-link',
    test: urlObj => !!urlObj.protocol,
    getObject: () => null,
    getElement: (document, a) => {
      const clone = a.cloneNode();
      clone.setAttribute('target', '_blank');
      clone.innerHTML = a.innerHTML;
      return clone;
    },
  },
];


const parseLink = (document, el) => {
  const urlObj = url.parse(el.href);
  const qs = queryString.parse(urlObj.query);
  const provider = linkProviders.find(item => item.test(urlObj, qs));

  return (
    !provider
      ? null
      : {
        obj: provider.getObject(el, urlObj, qs),
        el: provider.getElement(document, el, urlObj, qs),
      }
  );
};


internals.parseLinks = (body) => {
  const { window } = new JSDOM(body);
  const { document } = window;
  const embeds = [...document.querySelectorAll('a')].reduce(
    (memo, el) => {
      const parsedLink = parseLink(document, el);
      if (!parsedLink) {
        return memo;
      }

      if (parsedLink.el.tagName === 'IFRAME') {
        const container = Object.assign(document.createElement('div'), {
          className: 'iframe-container',
        });
        container.appendChild(parsedLink.el);
        el.replaceWith(container);
      } else {
        el.replaceWith(parsedLink.el);
      }

      return (
        !parsedLink.obj
          ? memo
          : [...memo, parsedLink.obj]
      );
    },
    [],
  );

  return { body: document.body.innerHTML, embeds };
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
    return { title, ...meta };
  }

  const {
    body,
    embeds,
  } = internals.parseLinks(exports.tokensToHTML(bodyTokens, tokens.links));

  if (embeds && embeds.length) {
    Object.assign(meta, { embeds });
  }

  return { title, ...meta, body };
};


exports.getReadmeFileName = locale => (
  (!locale || locale.slice(0, 2) === 'es')
    ? 'README.md'
    : `README.${locale}.md`
);
