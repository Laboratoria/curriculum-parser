import util from 'node:util';
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

// @description este función valida y "aplana" los learning objetives
export const transformLearningObjectives = async (dir, opts, meta = {}) => {
  const { learningObjectives, variants } = meta;

  if (!learningObjectives) {
    // FIXME: Deberíamos ignorar variantes si no hay learning objectives??
    return {};
  }

  const shouldValidate = opts.lo && existsSync(`${opts.lo}/data.yml`);
  const known = !shouldValidate ? null : await loadYaml(`${opts.lo}/data.yml`);
  const knownFlattened = !shouldValidate ? null : flattenLearningObjectives(known);

  const parseLearningObjectives = (arr, isVariant = false) => {
    const parsed = arr.map((strOrObj) => {
      const obj = (
        typeof strOrObj === 'string'
          ? { id: strOrObj }
          : strOrObj
      );

      if (typeof obj?.id !== 'string') {
        throw new Error(
          `Invalid learning objective: ${util.inspect(strOrObj)}`,
        );
      }

      if (shouldValidate && !knownFlattened.includes(obj.id)) {
        throw Object.assign(
          new Error(`Unknown learning objectives: ${obj.id}.`),
          { path: meta.__source || dir },
        );
      }

      if (!isVariant && obj.exclude) {
        throw new Error('Only variants can have excluded learning objectives');
      }

      return obj;
    });

    if (!shouldValidate) {
      return parsed;
    }

    // Expand children when only parent is mentioned?
    return parsed.reduce(
      ({ expanded, ids }, learningObjective) => {
        const { id, ...rest } = learningObjective;
        const flattenedChildren = findFlattenedChildren(known, id);
        const x = (
          !flattenedChildren
            ? [learningObjective]
            : parseLearningObjectives(flattenedChildren).map(obj => ({ ...obj, ...rest }))
        );
        const unique = x.filter(obj => !ids.includes(obj.id));
        return {
          expanded: expanded.concat(unique),
          ids: ids.concat(unique.map(obj => obj.id)),
        };
      },
      { expanded: [], ids: [] },
    ).expanded;
  };

  const parsedLearningObjectives = parseLearningObjectives(learningObjectives);

  return {
    learningObjectives: parsedLearningObjectives,
    variants: variants?.map(variant => ({
      ...variant,
      learningObjectives: parseLearningObjectives(variant.learningObjectives, true)
        .filter(({ id, optional, exclude }) => !parsedLearningObjectives.some(
          lo => (
            lo.id === id
            && !!optional === !!lo.optional
            && !!exclude === !!lo.exclude
          ),
        )),
    })),
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
    learningObjectives,
    variants,
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
    ...(!!learningObjectives && { learningObjectives }),
    ...(!!variants && { variants }),
    intl: langs.reduce(
      (memo, lang, idx) => ({ ...memo, [lang]: parsedLocales[idx] }),
      {},
    ),
    cover,
    thumb,
  };
};
