import path from 'node:path';
import {
  allFulfilledOrThrow,
  detectLangs,
  getPrefixedDirs,
  getTitle,
  parseDirname,
  parseReadmes,
  parser,
} from './common.js';
import { parseChallenge } from './challenge.js';

const knownTypes = ['read', 'practice', 'quiz'];

const parseDuration = (str) => {
  const matches = /^(\d+(\.\d+)?)\s*(m|min|h)?$/.exec(str);

  if (!matches || matches.length < 4) {
    return null;
  }

  if (matches[3] === 'h') {
    return parseInt(parseFloat(matches[1], 10) * 60, 10);
  }

  return parseInt(matches[1], 10);
};

const parseChallenges = async (dir) => {
  const prefixedDirs = await getPrefixedDirs(dir);

  const results = await Promise.allSettled(
    prefixedDirs.map(
      slug => parseChallenge(path.join(dir, slug)).catch((err) => {
        throw Object.assign(err, {
          path: err.path || path.join(dir, slug),
        });
      }),
    ),
  );

  return allFulfilledOrThrow(results, 'challenge');
};

export const parsePart = async (dir) => {
  const { prefix, slug } = parseDirname(dir);
  const langs = await detectLangs(dir);

  const { parsedLocales, meta } = await parseReadmes(
    dir,
    langs,
    'part',
    async rootNode => ({
      title: getTitle(rootNode),
      body: parser.stringify(await parser.run({
        type: 'root',
        children: rootNode.children.slice(1),
      })),
    }),
  );

  const { type, format, duration } = (meta || {});

  if (!knownTypes.includes(type)) {
    throw new Error(`Unknown part type "${type}"`);
  }

  const parsedDuration = parseDuration(duration);
  if (!Number.isInteger(parsedDuration)) {
    throw new Error(`Failed parsing duration "${duration}"`);
  }

  return {
    prefix,
    slug,
    type,
    format,
    duration: parsedDuration,
    intl: langs.reduce(
      (memo, lang, idx) => ({
        ...memo,
        [lang]: parsedLocales[idx],
      }),
      {},
    ),
    ...(type === 'practice' && {
      challenges: await parseChallenges(dir),
    }),
  };
};
