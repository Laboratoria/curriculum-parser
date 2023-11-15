import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import {
  detectLangs,
  getTitle,
  parseDirname,
  parseReadmes,
  parser,
  parseTracks,
} from './common.js';

const knownEnvs = ['cjs', 'dom', 'form'];

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

const parseForm = async (children) => {
  const questionsHeadingIdx = children.findIndex(node => (
    node.type === 'heading'
    && node.depth === 2
    && node.children?.length
    && node.children[0]?.type === 'text'
    && /(Preguntas|Perguntas)/i.test(node.children[0].value)
  ));

  const nextHeadingIdx = children.slice(questionsHeadingIdx + 1).findIndex(
    ({ type, depth }) => type === 'heading' && depth === 2,
  );

  const questionsNodes = children.slice(
    questionsHeadingIdx + 1,
    nextHeadingIdx === -1 ? undefined : questionsHeadingIdx + nextHeadingIdx,
  );

  const questions = questionsNodes.reduce(
    (memo, node) => {
      if (node.type === 'heading' && node.depth === 3) {
        return memo.concat({
          title: node.children[0].value,
          body: [],
        });
      }

      const current = memo[memo.length - 1];

      if (!current) {
        return memo;
      }

      if (
        node.type === 'heading'
        && node.depth === 4
        && node.children?.length
        && node.children[0]?.type === 'text'
        && /(Opciones|Opções)/i.test(node.children[0].value)
      ) {
        Object.assign(current, { options: [] });
        return memo;
      }

      if (
        node.type === 'heading'
        && node.depth === 4
        && node.children?.length
        && node.children[0]?.type === 'text'
        && /(Solución|Solução)/i.test(node.children[0].value)
      ) {
        Object.assign(current, { solution: {} });
        return memo;
      }

      if (current?.options && !current.solution && node.type === 'list' && node.ordered) {
        Object.assign(current, {
          options: node.children.map(child => child.children),
        });
        return memo;
      }

      if (current.solution && node.type === 'list' && !node.ordered) {
        const items = node.children.reduce(
          (prev, child) => {
            if (child.type !== 'listItem') {
              return prev;
            }
            // First paragraph in the list item has the item name and sometimes
            // also its value.
            const firstP = child.children[0];
            // The first child of the firstP is expected to be a <code> tag
            // qith the item name.
            if (firstP.children[0].type !== 'inlineCode') {
              return prev;
            }
            const name = firstP.children[0].value;
            const value = (
              name !== 'validate'
                ? firstP.children[1].value.trim().replace(/^:\s?/, '')
                : child.children[1]?.value
            );

            if (name === 'value' && current.options) {
              const val = value.split(',').map(str => parseInt(str, 10) - 1);
              return {
                ...prev,
                [name]: val.length > 1 ? val : val[0],
              };
            }

            return {
              ...prev,
              [name]: (
                ['required', 'multiline'].includes(name)
                  ? value !== 'false'
                  : value
              ),
            };
          },
          { required: true },
        );
        Object.assign(current.solution, items);
        return memo;
      }

      Object.assign(current, { body: current.body.concat(node) });
      return memo;
    },
    [],
  );

  return {
    body: parser.stringify(await parser.run({
      type: 'root',
      children: children.slice(0, questionsHeadingIdx),
    })),
    questions: await Promise.all(questions.map(async question => ({
      ...question,
      body: parser.stringify(await parser.run({
        type: 'root',
        children: question.body,
      })),
      ...(question.options && {
        options: await Promise.all(question.options.map(
          async opt => parser.stringify(await parser.run({
            type: 'root',
            children: opt,
          })),
        )),
      }),
    }))),
  };
};

export const parseChallenge = async (dir, opts, pkg) => {
  const { prefix, slug } = parseDirname(dir);
  const langs = await detectLangs(dir);

  const { parsedLocales, meta } = await parseReadmes(
    dir,
    langs,
    'challenge',
    async (rootNode, localizedMeta) => {
      const { env } = localizedMeta || {};
      const children = rootNode.children.slice(1);

      return {
        title: getTitle(rootNode),
        ...(
          env === 'form'
            ? await parseForm(children)
            : {
              body: parser.stringify(await parser.run({
                type: 'root',
                children,
              })),
            }
        ),
      };
    },
  );

  if (!knownEnvs.includes(meta.env)) {
    throw new Error(`Unknown challenge env "${meta.env}"`);
  }

  // TODO: Validate files (boilerplate, tests and solution)
  const files = flattenTree(await dirToTree(dir));

  const { track, tracks } = parseTracks(meta);

  return {
    slug,
    prefix,
    repo: opts?.repo,
    path: path.relative(process.cwd(), dir),
    version: opts?.version,
    parserVersion: pkg?.version,
    createdAt: new Date(),
    track,
    tracks,
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
