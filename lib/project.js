import { existsSync } from 'node:fs';
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { marked } from 'marked';
import yaml from 'js-yaml';

// const { getImages } = require('./common');

const parseDirname = (dir) => {
  const basename = path.basename(dir);
  const matches = /^(\d{2})-([a-z-]{1,97})$/.exec(basename);

  if (!matches || matches.length < 3) {
    throw Object.assign(
      new Error(`Expected project dir to be in 00-slug format and got ${basename}`),
      { path: path.resolve(dir) },
    );
  }

  return { prefix: matches[1], slug: matches[2] };
};

const detectLocales = async dir => {
  const files = await readdir(dir);
  return files
    .filter(file => file.match(/^README/))
    .map(file => {
      const matches = /^README\.(.*)\.md/.exec(file);
      return (!matches)
        ? 'es-ES'
        : matches[1];
    });
};

const getProjectTitle = ([token]) => {
  if (!token || token.type !== 'heading' || token.depth !== 1) {
    throw new Error(
      `Expected README.md to start with h1 and instead saw ${token.type}${token.depth ? ` (depth: ${token.depth})` : ''
      }`,
    );
  }
  return token.text;
};

const getSummary = (tokens) => {
  const headingIdx = tokens.findIndex(token => (
    token.type === 'heading'
    && token.depth === 2
    && /(resumen|resumo)/i.test(token.text)
  ));

  if (headingIdx === -1 || tokens[headingIdx + 1].type !== 'paragraph') {
    return null;
  }

  return marked.parse(tokens[headingIdx + 1].text);
};

const loadYaml = async fname => (
  yaml.load(await readFile(fname, 'utf8'))
);


const flattenLearningObjectives = (node, prefix = '') => {
  if (typeof node === 'string') {
    return [`${prefix}${node}`];
  }

  return Object.keys(node).reduce(
    (memo, key) => [
      ...memo,
      `${prefix}${key}`,
      ...(
        Array.isArray(node[key])
          ? node[key].reduce(
            (prev, val) => [
              ...prev,
              ...flattenLearningObjectives(val, `${prefix}${key}/`),
            ],
            [],
          )
          : []
      ),
    ],
    [],
  );
};

const findChildren = (tree, nodePath) => {
  // if (!nodePath) {
  //   return tree;
  // }

  const parts = nodePath.split('/');
  if (parts.length === 1) {
    return tree[parts[0]];
  }

  // each element can be either a string (leaf) or an object (node with children)
  const found = tree[parts[0]].find(node => (
    typeof node === 'string'
      ? node === parts[1]
      : !!node[parts[1]]
  ));

  if (typeof found === 'string') {
    return null; // no children
  }

  return findChildren(found, parts.slice(1).join('/'));
};

const findFlattenedChildren = (known, learningObjective) => {
  const children = findChildren(known, learningObjective);
  if (!children) {
    return null;
  }

  const flattened = flattenLearningObjectives({ [learningObjective]: children });
  const leavesOnly = flattened.reduce(
    (memo, item) => {
      const parts = item.split('/');
      const parent = parts.length > 1 ? parts.slice(0, -1).join('/') : null;
      if (parent) {
        return memo.filter(i => i !== parent).concat(item);
      }
      return memo.concat(item);
    },
    [],
  );
  return leavesOnly;
};

const getLearningObjectives = async (dir, opts) => {
  if (!existsSync(`${dir}/project.yml`)) {
    return undefined;
  }

  const { learningObjectives } = await loadYaml(`${dir}/project.yml`);

  if (!opts.lo || !existsSync(`${opts.lo}/data.yml`)) {
    return learningObjectives;
  }

  const known = await loadYaml(`${opts.lo}/data.yml`);
  const knownFlattened = flattenLearningObjectives(known);

  const unknown = learningObjectives.filter(item => !knownFlattened.includes(item));
  if (unknown.length) {
    throw new Error(`Unknown learning objectives: ${unknown.join(', ')}.`);
  }

  // Expand children when only parent is mentioned?
  return [...new Set(learningObjectives.reduce(
    (memo, learningObjective) => {
      const flattenedChildren = findFlattenedChildren(known, learningObjective);
      if (flattenedChildren) {
        return memo.concat(flattenedChildren);
      }
      return memo.concat(learningObjective);
    },
    [],
  ))];
};


export const parseProject = async (dir, opts, pkg) => {
  const { prefix, slug } = parseDirname(dir);
  const locales = await detectLocales(dir);

  const parsedLocales = await Promise.all(locales.map(async (locale) => {
    if (!['es-ES', 'pt-BR'].includes(locale)) {
      throw new Error(`Unsupported locale: ${locale}`);
    }

    const fname = locale === 'es-ES' ? 'README.md' : `README.${locale}.md`;

    const text = await readFile(path.join(dir, fname), 'utf8');
    const trimmed = (text || '').trim();
    if (!trimmed) {
      throw new Error('Project README.md is empty');
    }

    const tokens = marked.lexer(trimmed);

    return {
      title: getProjectTitle(tokens),
      summary: getSummary(tokens),
      // ...(await getImages(dir, tokens)),
    };
  }));

  return {
    slug,
    repo: opts.repo,
    path: path.relative(process.cwd(), dir),
    version: opts.version,
    parserVersion: pkg.version,
    createdAt: new Date(),
    prefix: parseInt(prefix, 10),
    track: opts.track,
    learningObjectives: await getLearningObjectives(dir, opts),
    intl: locales.reduce(
      (memo, locale, idx) => ({ ...memo, [locale]: parsedLocales[idx] }),
      {},
    ),
  };
};


// module.exports = (dir, opts = {}) => {
//   const readme = path.join(dir, getReadmeFileName(opts.locale));
//   const basename = path.basename(dir);
//   const matches = /^(\d{2})-([a-z-]{1,97})$/.exec(basename);

//   if (!matches || matches.length < 3) {
//     return Promise.reject(
//       Object.assign(
//         new Error(`Expected project dir to be in 00-slug format and got ${basename}`),
//         { path: path.resolve(dir) },
//       ),
//     );
//   }

//   const [prefix, slug] = matches.slice(1);
//   const lang = opts.locale.split('-')[0];

//   if (!['es', 'pt'].includes(lang)) {
//     return Promise.reject(new Error(`Unsupported language: ${lang}`));
//   }

//   return readFile(readme, 'utf8')
//     .then((text) => {
//       const trimmed = (text || '').trim();
//       if (!trimmed) {
//         throw new Error('Project README.md is empty');
//       }
//       return marked.lexer(trimmed);
//     })
//     .then(async tokens => ({
//       slug: opts.suffix ? `${slug}-${opts.suffix}` : slug,
//       repo: opts.repo,
//       path: path.relative(process.cwd(), dir),
//       version: opts.version,
//       parserVersion: pkg.version,
//       createdAt: new Date(),
//       prefix: parseInt(prefix, 10),
//       title: getProjectTitle(tokens),
//       locale: opts.locale,
//       track: opts.track,
//       summary: getSummary(tokens),
//       learningObjectives: await getLearningObjectives(dir, opts),
//       ...(await getImages(dir, tokens)),
//     }))
//     .catch((err) => {
//       throw Object.assign(err, { path: readme });
//     });
// };

// module.exports.getLearningObjectives = getLearningObjectives;
// module.exports.loadYaml = loadYaml;
// module.exports.flattenLearningObjectives = flattenLearningObjectives;
