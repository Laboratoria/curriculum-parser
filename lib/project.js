import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import yaml from 'js-yaml';
import {
  parseDirname,
  detectLangs,
  parseReadmes,
  getTitle,
  parser,
  parseTracks,
} from './common.js';

const getSummary = (rootNode) => {
  const headingIdx = rootNode.children.findIndex(node => (
    node.type === 'heading'
    && node.depth === 2
    && /(resumen|resumo)/i.test(node.children[0]?.value)
  ));

  if (headingIdx === -1 || rootNode.children[headingIdx + 1].type !== 'paragraph') {
    throw new Error('No project summary found');
  }

  return parser.stringify(parser.runSync(rootNode.children[headingIdx + 1]));
};

export const loadYaml = async fname => (
  yaml.load(await readFile(fname, 'utf8'))
);

export const flattenLearningObjectives = (node, prefix = '') => {
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

const reduceAndSetChildren = (learningObjectives, known) => {
  if (learningObjectives.length === 0) {
    return [];
  }

  return [...new Set(learningObjectives.reduce(
    (memo, learningObjective) => {
      const flattenedChildren = findFlattenedChildren(
        known,
        learningObjective,
      );
      if (flattenedChildren) {
        return memo.concat(flattenedChildren);
      }
      return memo.concat(learningObjective);
    },
    [],
  ))];
};

// @description este función valida y "aplana" los learning objetives
export const transformLearningObjectives = async (dir, opts, meta) => {
  if (!meta || !meta.learningObjectives) {
    return undefined;
  }

  let optionalLearningObjectives = [];

  const { learningObjectives, variants } = meta;

  const variantOptions = opts.variants?.split(',') || [];

  variants?.forEach(variantInYml => {
    if(variantOptions.includes(variantInYml.name)){
      variantInYml.learningObjectives.forEach(learningObjective => {
        if (typeof learningObjective === 'string') {
          learningObjectives.push(learningObjective);
        }

        if (typeof learningObjective === 'object') {
          if (learningObjective[Object.keys(learningObjective)[0]].optional &&
          !optionalLearningObjectives.includes(Object.keys(learningObjective)[0])) {
            optionalLearningObjectives.push(Object.keys(learningObjective)[0]);
          }
        }
      })
    }
  });

  if (!opts.lo || !existsSync(`${opts.lo}/data.yml`)) {
    return learningObjectives;
  }

  const known = await loadYaml(`${opts.lo}/data.yml`);
  const knownFlattened = flattenLearningObjectives(known);

  const unknown = learningObjectives.filter(
    item => !knownFlattened.includes(item),
  );

  if (unknown.length) {
    throw Object.assign(
      new Error(`Unknown learning objectives: ${unknown.join(', ')}.`),
      { path: meta.__source || dir },
    );
  }

  // TODO: será mejor que esta función quede dentro de la función transformLearningObjectives?
  const nonOptionalLearningObjectives = reduceAndSetChildren(learningObjectives, known);
  optionalLearningObjectives = reduceAndSetChildren(optionalLearningObjectives, known);

  return {
    nonOptionalLearningObjectives,
    ...(optionalLearningObjectives.length > 0 && { optionalLearningObjectives }),
  };
};

export const parseProject = async (dir, opts, pkg) => {
  const { prefix, slug } = parseDirname(dir);
  const langs = await detectLangs(dir);

  const { parsedLocales, meta } = await parseReadmes(
    dir,
    langs,
    'project',
    async rootNode => ({
      title: getTitle(rootNode),
      summary: getSummary(rootNode),
    }),
  );

  const { cover, thumb } = meta;

  const { track, tracks } = parseTracks(meta);

  const {
    nonOptionalLearningObjectives,
    optionalLearningObjectives
  } = await transformLearningObjectives(dir, opts, meta) || {};

  return {
    slug,
    repo: opts.repo,
    path: path.relative(process.cwd(), dir),
    version: opts.version,
    parserVersion: pkg.version,
    createdAt: new Date(),
    prefix: parseInt(prefix, 10),
    track,
    tracks,
    ...(!!nonOptionalLearningObjectives && { learningObjectives: nonOptionalLearningObjectives }),
    ...(!!optionalLearningObjectives && { optionalLearningObjectives }),
    intl: langs.reduce(
      (memo, lang, idx) => ({ ...memo, [lang]: parsedLocales[idx] }),
      {},
    ),
    cover,
    thumb,
  };
};
