import { deepStrictEqual } from 'node:assert';
import { Buffer } from 'node:buffer';
import { existsSync } from 'node:fs';
import { stat, readFile, writeFile, readdir } from 'node:fs/promises';
import https from 'node:https';
import path from 'node:path';
import queryString from 'node:querystring';
import url from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import sharp from 'sharp';
import yaml from 'js-yaml';


const linkProviders = [{
  id: 'vimeo',
  test: urlObj => urlObj.hostname === 'vimeo.com',
  // getObject: (linkNode, urlObj) => ({
  //   type: 'video',
  //   provider: 'vimeo',
  //   href: linkNode.url,
  //   id: urlObj.pathname.slice(1),
  // }),
  getHTML: (urlObj) => {
    const videoId = urlObj.pathname.slice(1);
    const qs = queryString.encode({
      title: 0,
      byline: 0,
      portrait: 0,
      ...queryString.decode(urlObj.query),
    });
    const src = `https://player.vimeo.com/video/${videoId}?${qs}`;

    const attributes = {
      width: 640,
      height: 360,
      src,
      frameBorder: '0',
      scrolling: 'no',
      allowfullscreen: 'true',
      mozallowfullscreen: 'true',
      webkitallowfullscreen: 'true',
    };

    return `<iframe ${Object.entries(attributes).map(([key, value]) => `${key}="${value}"`).join(' ')}></iframe>`;
  },
},
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
  getHTML: (urlObj, { v, ...qs }) => {
    const videoId = urlObj.hostname === 'youtu.be' ? urlObj.pathname.slice(1) : v;
    const params = queryString.stringify({ ...qs, autoplay: 0 });
    const attributes = {
      width: 640,
      height: 360,
      src: `https://www.youtube.com/embed/${videoId}?${params}`,
      frameBorder: '0',
      gesture: 'media',
      allow: 'encrypted-media',
      allowfullscreen: 'true',
    };
    return `<iframe ${Object.entries(attributes).map(([key, value]) => `${key}="${value}"`).join(' ')}></iframe>`;
  },
}];

// /**
//  *
//  * @param {*} nodes an array of mdast nodes (markdown nodes)
//  * @returns array of nodes, with link nodes transformed
//  */
// const transformLinks = nodes => nodes.map((node) => {
//   if (node.type !== 'link') {
//     return node;
//   }
//   const urlObj = url.parse(node.url);
//   const qs = queryString.parse(urlObj.query);
//   const provider = linkProviders.find(item => item.test(urlObj, qs));

//   if (!provider) {
//     return node;
//   }

//   // at this point the nodes are of mdast markdown
//   // and if we want to transform to an iframe
//   // we can only do node type html https://github.com/syntax-tree/mdast#nodes
//   // example {type: 'html', value: '<div>'}

//   // TODO use children text for alt tag ?
//   // TODO put in iframe container https://github.com/Laboratoria/curriculum-parser/blob/main/lib/common.js#L315
//   const iframeNode = { ...node, type: 'html', value: provider.getHTML(urlObj) };
//   console.log(iframeNode);
//   return iframeNode;
// });

const transformLink = (node) => {
  if (node.type !== 'link') {
    return node;
  }
  const urlObj = url.parse(node.url);
  const qs = queryString.parse(urlObj.query);
  const provider = linkProviders.find(item => item.test(urlObj, qs));

  if (!provider) {
    return node;
  }

  // at this point the nodes are of mdast markdown
  // and if we want to transform to an iframe
  // we can only do node type html https://github.com/syntax-tree/mdast#nodes
  // example {type: 'html', value: '<div>'}

  // TODO use children text for alt tag ?
  // TODO put in iframe container https://github.com/Laboratoria/curriculum-parser/blob/main/lib/common.js#L315
  const iframeNode = { ...node, type: 'html', value: provider.getHTML(urlObj, qs) };
  console.log(iframeNode);
  return iframeNode;
};

export const parser = unified()
  .use(remarkParse)
  .use(remarkRehype, { allowDangerousHtml: true }) // https://github.com/remarkjs/remark-rehype/issues/8#issuecomment-309298870
  .use(rehypeStringify, { allowDangerousHtml: true });

export const parseDirname = (dir) => {
  const basename = path.basename(dir);

  if (basename !== basename.toLowerCase()) {
    throw new Error(
      `Directory name must be all lowercase and received ${basename}`,
    );
  }

  const matches = /^((\d{2})-)?([a-z1-9-]{1,97})$/.exec(basename);

  if (!matches) {
    throw new Error(
      'Directory name must only contain alphanumeric characters and hyphens (-)',
    );
  }

  return { prefix: matches[2], slug: matches[3] };
};

export const detectLangs = async (dir) => {
  const files = await readdir(dir);
  const langs = files
    .filter(file => file.match(/^README/))
    .map((file) => {
      const matches = /^README\.(.+)\.md/.exec(file);
      return (!matches)
        ? 'es'
        : matches[1];
    });

  if (!langs.length) {
    throw new Error('No langs detected');
  }

  return langs;
};

const splitMetaAndContent = (text) => {
  const lines = text.split('\n');

  if (lines[0] !== '---') {
    return [null, text];
  }

  const metaEndIdx = lines.slice(1).findIndex(line => line === '---');

  if (metaEndIdx < 0) {
    throw new Error('Meta section must be closed with a "---"');
  }

  return [
    lines.slice(1, metaEndIdx + 1).join('\n').trim(),
    lines.slice(metaEndIdx + 2).join('\n').trim(),
  ];
};

const getMetaFromFile = async (type, dir) => {
  const fname = `${dir}/${type}.yml`;

  if (!existsSync(fname)) {
    return null;
  }

  try {
    return { ...yaml.load(await readFile(fname)), __source: fname };
  } catch (err) {
    throw Object.assign(err, { path: fname });
  }
};

export const getTitle = (rootNode) => {
  const [firstChild] = rootNode.children;

  if (!firstChild || firstChild.type !== 'heading' || firstChild.depth !== 1) {
    throw new Error(
      `Expected README.md to start with h1 and instead saw ${firstChild.type}${(
        firstChild.depth
          ? ` (depth: ${firstChild.depth})`
          : ''
      )}`,
    );
  }

  if (firstChild.children.length !== 1 || firstChild.children[0].type !== 'text') {
    throw new Error('Expected h1 title to contain only a text node');
  }

  return firstChild.children[0].value;
};

const getCoverImage = (rootNodes) => {
  const [rootNode] = rootNodes;
  const find = (node, fn, parent) => {
    if (fn({ ...node, parent })) {
      return { ...node, parent };
    }

    if (!node.children?.length) {
      return null;
    }

    for (let i = 0; i < node.children.length; i += 1) {
      const found = find(node.children[i], fn, node);
      if (found) {
        return found;
      }
    }

    return null;
  };

  const imgNode = find(rootNode, node => node.type === 'image' && node.parent?.type === 'paragraph');

  if (!imgNode) {
    return null;
  }

  return imgNode.url;
};

const fetchImage = src => new Promise((resolve, reject) => {
  https.get(src, (resp) => {
    if (resp.statusCode !== 200) {
      return reject(new Error(`HTTP error ${resp.statusCode}`));
    }

    let buffer;
    resp.on('error', reject);
    resp.on('data', (chunk) => {
      buffer = (typeof buffer === 'undefined')
        ? chunk
        : Buffer.concat([buffer, chunk]);
    });
    return resp.on('end', () => resolve(buffer));
  });
});

const getImages = (dir, rootNodes) => {
  const cover = getCoverImage(rootNodes);
  const thumbFile = path.join(dir, 'thumb.png');

  const createThumb = async (src) => {
    const buffer = await fetchImage(src);
    const data = await sharp(buffer).resize(395).toBuffer();
    await writeFile(thumbFile, data, { encoding: 'base64' });
    return data;
  };

  return stat(thumbFile)
    .then(() => readFile(thumbFile, 'base64'))
    .catch((err) => {
      if (err.code !== 'ENOENT') {
        throw err;
      }
      // does not exist!
      return !cover ? null : createThumb(cover);
    })
    .then(data => ({
      cover,
      thumb: (
        data
          ? `data:image/png;base64,${data.toString('base64')}`
          : null
      ),
    }));
};

export const parseReadmes = async (dir, langs, type, fn) => {
  const parsedLocalesWithMeta = await Promise.all(
    langs.map(async (lang) => {
      if (!['es', 'pt'].includes(lang)) {
        throw new Error(`Unsupported lang: ${lang}`);
      }

      const fname = lang === 'es' ? 'README.md' : `README.${lang}.md`;

      try {
        const text = await readFile(path.join(dir, fname), 'utf8');
        const trimmed = (text || '').trim();

        if (!trimmed) {
          throw new Error(`${path.join(dir, fname)} is empty`);
        }

        const [metaText, contentText] = splitMetaAndContent(trimmed);
        const rootNode = parser.parse(contentText);

        // TODO: analice y reemplace links a proveedores como
        // YouTube, Vimeo, Loom, Google Slides, etc en el body de los archivos markdown analizados

        // eslint-disable-next-line no-unused-vars
        // const getAllChildNodes = (node) => {
        //   if (node.children?.length) {
        //     // eslint-disable-next-line arrow-body-style
        //     return node.children.reduce((memo, n) => {
        //       return [...memo, n, ...getAllChildNodes(n)];
        //     }, []);
        //   }
        //   return [node];
        // };

        const parseLinks = (node) => {
          if (node.type === 'link') {
            const linkProps = transformLink(node);
            Object.assign(node, linkProps);
          }
          if (node.children?.length) {
            return ({ ...node, children: node.children.map(n => parseLinks(n)) });
          }
          // console.log(node);
          return node;
        };
        // TODO use link providers to change Youtube
        // https://github.com/Laboratoria/curriculum-parser/blob/941eab7e5ce9aa97f165f34c9f8253552c1a5dec/lib/common.js#L56

        // const nodes = transformLinks(getAllChildNodes(rootNode));
        // console.log(nodes); // does this replace the value of parsedRootNode?

        const meta = (
          !metaText
            ? null
            : { ...yaml.load(metaText), __source: 'inline' }
        );

        const parsedRootNode = await fn(parseLinks(rootNode), meta);
        // const parsedRootNode = await fn(rootNode, meta);
        return [parsedRootNode, meta, rootNode];
      } catch (err) {
        throw Object.assign(err, { path: err.path || path.join(dir, fname) });
      }
    }),
  );

  /* eslint no-shadow: off */
  const { parsedLocales, meta, rootNodes } = parsedLocalesWithMeta.reduce(
    (memo, [parsedRootNode, meta, rootNode]) => {
      const parsedLocales = memo.parsedLocales.concat(parsedRootNode);
      const rootNodes = memo.rootNodes.concat(rootNode);

      if (!meta) {
        return { ...memo, parsedLocales, rootNodes };
      }

      if (!memo.meta) {
        return { meta, parsedLocales, rootNodes };
      }

      try {
        deepStrictEqual(meta, memo.meta);
        return { ...memo, parsedLocales, rootNodes };
      } catch (err) {
        throw Object.assign(err, { path: dir });
      }
    },
    { parsedLocales: [], meta: null, rootNodes: [] },
  );

  return {
    parsedLocales,
    meta: Object.assign(
      meta || await getMetaFromFile(type, dir) || {},
      ['project', 'topic'].includes(type)
        ? await getImages(dir, rootNodes)
        : {},
    ),
  };
};

export const comparePrefixedDirs = (a, b) => (
  parseInt(a.split('-')[0], 10) - parseInt(b.split('-')[0], 10)
);

export const getPrefixedDirs = async (dir) => {
  const subdirs = await readdir(dir);

  const filteredByName = subdirs.filter(subdir => /^\d{2}-/.test(subdir));

  const isDir = await Promise.all(filteredByName.map(async (subdir) => {
    const stats = await stat(path.join(dir, subdir));
    return stats.isDirectory();
  }));

  return filteredByName
    .filter((_, idx) => !!isDir[idx])
    .sort(comparePrefixedDirs);
};

export const allFulfilledOrThrow = (results, type) => {
  const { errors, fulfilled } = results.reduce(
    ({ errors, fulfilled }, { status, reason, value }) => (
      status === 'rejected'
        ? { fulfilled, errors: errors.concat(reason) }
        : { fulfilled: fulfilled.concat(value), errors }
    ),
    { errors: [], fulfilled: [] },
  );

  if (errors.length) {
    throw Object.assign(new Error(`Failed parsing ${type}s`), { errors });
  }

  return fulfilled;
};
