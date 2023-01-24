import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  detectLangs,
  getTitle,
  parseDirname,
  parseReadmes,
  parser,
} from './common.js';

const knownEnvs = ['cjs', 'dom'];

const dirToTree = (dir) => {
  const recurse = async (current, basedir) => {
    const files = await readdir(current);
    const filtered = files.filter(fname => !fname.endsWith('.md'));

    return Promise.all(filtered.map(async (file) => {
      const stats = await stat(path.join(current, file));
      const relative = path.join(current, file).replace(basedir, '');

      if (stats.isDirectory()) {
        return {
          path: relative,
          children: await recurse(path.join(current, file), basedir),
        };
      }

      return {
        path: relative,
        content: await readFile(path.join(current, file), 'utf8'),
      };
    }));
  };

  return recurse(dir, dir);
};

const flattenTree = tree => tree.reduce(
  (memo, item) => {
    if (typeof item.content === 'string') {
      return { ...memo, [item.path]: item.content };
    }

    return {
      ...memo,
      ...flattenTree(item.children),
    };
  },
  {},
);

export const parseChallenge = async (dir, opts, pkg) => {
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

  if (!knownEnvs.includes(meta.env)) {
    throw new Error(`Unknown challenge env "${meta.env}"`);
  }

  // TODO: Validate files (boilerplate, tests and solution)
  const files = flattenTree(await dirToTree(dir));

  return {
    slug,
    prefix,
    repo: opts?.repo,
    path: path.relative(process.cwd(), dir),
    version: opts?.version,
    parserVersion: pkg?.version,
    createdAt: new Date(),
    track: meta.track,
    env: meta.env,
    intl: langs.reduce(
      (memo, lang, idx) => ({
        ...memo,
        [lang]: parsedLocales[idx],
      }),
      {},
    ),
    files,
  };
};
