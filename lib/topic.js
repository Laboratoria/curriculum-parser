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

const getSummary = (rootNode) => { // takes rootnode and children (heading paragraph etc)
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
 // finds a summary that is a heading of depth 2 or a paragraph that startsWith Tags
  if (endIdx < 1) { // returns empty string if none
    return '';
  }

  const node = {
    type: 'root',
    children: rootNode.children.slice(1, endIdx),
  };

  return parser.stringify(parser.runSync(node)); // or returns a <p> Javascript ... </p> 2 paragraphs?
};

//
// Gets unit list from links found in readme. Only units linked from main topic
// readme will be parsed.
//
// when getLinkedUnits is called we get the predicted outcome
// TODO see the outcome
// when called without a syllabus we get the error

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

  const endIdx = rootNode.children.slice(startIdx + 1)    // finds start and endIdx of syllabus
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

      const link = children.find(({ type }) => type === 'link');
      return memo.concat({
        title: link.children[0]?.value,
        slug: link.url,
      });
    },
    [],
  );
};

const parseUnit = async (dir, unit) => { // {slug: '01-basics', intl: {…} intl: {es: {…}, pt: {…}}slug: '01-basics'
  const unitDir = path.join(dir, unit.slug);
  const { prefix, slug } = parseDirname(unitDir);
  const prefixedDirs = await getPrefixedDirs(unitDir); //  ['01-values-variables-and-types', '02-variables', '03-comments', '04-guided-exercises', '05-quiz', '06-exercises']

  const results = await Promise.allSettled(
    prefixedDirs.map(
      slug => parsePart(path.join(unitDir, slug)).catch((err) => {
        throw Object.assign(err, {
          path: err.path || path.join(unitDir, slug),
        });
      }),
    ),
  );

  return {
    ...unit, // {slug: '03-functions', intl: {…}} why slug twice here?
    slug, // "functions"
    prefix, // "03"
    parts: allFulfilledOrThrow(results, 'part'),
  };
};
// calls parse unit on each unit after reducig n units by slug and sorting
const parseUnits = async (dir, langs, parsedLocales) => { // parsedLcales [ { title, summary, units [] }, ]
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

  return allFulfilledOrThrow(results, 'unit');  // returns array of {slug: 'flow-control', intl: {…}, prefix: '02', parts: Array(10)}
};

export const parseTopic = async (dir, opts, pkg) => {
  const { slug } = parseDirname(dir); // slug is "javascript"
  const langs = await detectLangs(dir); // ['es', 'pt']


  // with a topic with a certain slug and langs
  // parseTopic calls parseReadmes with the topic dir, langs detected
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

  const { track, cover, thumb } = meta;

  // throws error without track
  if (!['web-dev', 'ux'].includes(track)) {
    throw new Error(`Invalid track "${track}". Expected "web-dev" or "ux".`);
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

  if (duplicateSlugErrors.length) {   // test duplicate slug errors
    throw Object.assign(
      new Error('Duplicate slugs found'),
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
