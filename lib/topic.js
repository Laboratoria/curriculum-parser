import path from 'node:path';
import {
  allFulfilledOrThrow,
  comparePrefixedDirs,
  detectLangs,
  getPrefixedDirs,
  getTitle,
  parseDirname,
  parseReadmes,
  parser,
} from './common.js';
import { parsePart } from './part.js';

const getSummary = (rootNode) => {
  const endIdx = rootNode.children.findIndex(
    ({ type, depth, children }) => (
      (type === 'heading' && depth === 2)
      || (
        type === 'paragraph'
        && children[0]?.type === 'text'
        && children[0]?.value.startsWith('Tags:')
      )
    ),
  );

  if (endIdx < 1) {
    return '';
  }

  const node = {
    type: 'root',
    children: rootNode.children.slice(1, endIdx),
  };

  return parser.stringify(parser.runSync(node));
};

//
// Gets unit list from links found in readme. Only units linked from main topic
// readme will be parsed.
//
const getLinkedUnits = (rootNode) => {
  const startIdx = rootNode.children.findIndex(
    ({ type, depth, children }) => (
      type === 'heading'
      && depth === 2
      && children[0]?.type === 'text'
      && children[0]?.value.trim() === 'Syllabus'
    ),
  );

  if (startIdx < 0) {
    throw new Error('Main topic README must contain Syllabus heading');
  }

  const endIdx = rootNode.children.slice(startIdx + 1)
    .findIndex(({ type, depth }) => type === 'heading' && depth === 2);

  const sectionNodes = rootNode.children.slice(
    startIdx + 1,
    endIdx < 0 ? undefined : startIdx + 1 + endIdx,
  );

  return sectionNodes.reduce(
    (memo, { type, depth, children }) => {
      if (type !== 'heading' || depth !== 3) {
        return memo;
      }

      const link = children.find(child => child.type === 'link');
      return memo.concat({
        title: link.children[0]?.value,
        slug: link.url,
      });
    },
    [],
  );
};

const parseUnit = async (dir, unit) => {
  const unitDir = path.join(dir, unit.slug);
  const { prefix, slug } = parseDirname(unitDir);
  const prefixedDirs = await getPrefixedDirs(unitDir);

  const results = await Promise.allSettled(
    prefixedDirs.map(
      prefixedDir => parsePart(path.join(unitDir, prefixedDir)).catch((err) => {
        throw Object.assign(err, {
          path: err.path || path.join(unitDir, prefixedDir),
        });
      }),
    ),
  );

  const parts = await allFulfilledOrThrow(results, 'part');

  const { errors: duplicateSlugErrors } = parts.reduce(
    (memo, part) => {
      if (!memo.slugs.includes(part.slug)) {
        return { ...memo, slugs: memo.slugs.concat(part.slug) };
      }
      return {
        ...memo,
        errors: memo.errors.concat(new Error(`Duplicate part slug: ${part.slug}`)),
      };
    },
    { slugs: [], errors: [] },
  );

  if (duplicateSlugErrors.length) {
    throw Object.assign(
      new Error('Duplicate part slugs found'),
      { errors: duplicateSlugErrors, path: unitDir },
    );
  }

  return {
    ...unit,
    slug,
    prefix,
    parts,
  };
};

const parseUnits = async (dir, langs, parsedLocales) => {
  const unitsBySlug = parsedLocales.reduce(
    (memo, { units }, idx) => units.reduce(
      (prev, { slug, title }) => ({
        ...prev,
        [slug]: {
          ...prev[slug],
          intl: {
            ...prev[slug]?.intl,
            [langs[idx]]: { title },
          },
        },
      }),
      memo,
    ),
    {},
  );

  const sortedUnits = Object.keys(unitsBySlug)
    .sort(comparePrefixedDirs)
    .map(slug => ({ slug, ...unitsBySlug[slug] }));

  const results = await Promise.allSettled(
    sortedUnits.map(unit => parseUnit(dir, unit)),
  );

  return allFulfilledOrThrow(results, 'unit');
};

export const parseTopic = async (dir, opts, pkg) => {
  const { slug } = parseDirname(dir);
  const langs = await detectLangs(dir);

  const { parsedLocales, meta } = await parseReadmes(
    dir,
    langs,
    'topic',
    async rootNode => ({
      title: getTitle(rootNode),
      summary: getSummary(rootNode),
      units: getLinkedUnits(rootNode),
    }),
  );

  const { track, tracks, cover, thumb } = meta;

  if (!['web-dev', 'ux', 'data'].includes(track)) {
    throw new Error(`Invalid track "${track}". Expected "web-dev", "ux" or "data".`);
  }

  if (!tracks) {
    throw new Error('No tracks found. Expected at least one.');
  }

  const units = await parseUnits(dir, langs, parsedLocales);
  const { errors: duplicateSlugErrors } = units.reduce(
    (memo, unit) => {
      if (!memo.slugs.includes(unit.slug)) {
        return { ...memo, slugs: memo.slugs.concat(unit.slug) };
      }
      return {
        ...memo,
        errors: memo.errors.concat(new Error(`Duplicate unit slug: ${unit.slug}`)),
      };
    },
    { slugs: [], errors: [] },
  );

  if (duplicateSlugErrors.length) {
    throw Object.assign(
      new Error('Duplicate unit slugs found'),
      { errors: duplicateSlugErrors },
    );
  }

  return {
    slug,
    repo: opts.repo,
    path: path.relative(process.cwd(), dir),
    version: opts.version,
    parserVersion: pkg.version,
    createdAt: new Date(),
    track,
    tracks,
    intl: langs.reduce(
      (memo, lang, idx) => ({
        ...memo,
        [lang]: {
          title: parsedLocales[idx].title,
          summary: parsedLocales[idx].summary,
        },
      }),
      {},
    ),
    cover,
    thumb,
    units,
  };
};
