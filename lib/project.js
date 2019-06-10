const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const marked = require('marked');
const rubric = require('rubric');
const semver = require('semver');
const pkg = require('../package.json');


const readFile = promisify(fs.readFile);


const getProjectTitle = ([token]) => {
  if (!token) {
    throw new Error('Project is missing title');
  }
  if (token.type !== 'heading' || token.depth !== 1) {
    throw new Error(
      `Expected README.md to start with h1 and instead saw ${token.type}${
        token.depth ? ` (depth: ${token.depth})` : ''
      }`,
    );
  }
  return token.text;
};


const categoryToId = (str, lang) => {
  const key = [...str.trim().toLowerCase()].reduce(
    (memo, char) => (char === '*' ? memo : `${memo}${char}`),
    '',
  );

  // Try to match against known translations
  const knownTranslations = Object.keys(rubric.intl[lang])
    .reduce(
      (memo, k) => (
        (/^categories\.[^.]+$/.test(k) && rubric.intl[lang][k].toLowerCase() === key)
          ? [...memo, k.slice(k.indexOf('.') + 1)]
          : memo
      ),
      [],
    );

  if (knownTranslations.length > 1) {
    throw new Error(`More than one possible translation for category: ${str}`);
  }

  if (knownTranslations.length === 1) {
    return knownTranslations[0];
  }

  throw new Error(`Unknown skills category: ${str}`);
};


const skillToId = (str, rootCategory, category, lang) => {
  const key = str.trim().toLowerCase();

  // Try to match against known translations
  const knownTranslations = Object.keys(rubric.intl[lang])
    .reduce(
      (memo, k) => (
        (/^skills\.[^.]+$/.test(k) && rubric.intl[lang][k].toLowerCase() === key)
          ? [...memo, k.slice(k.indexOf('.') + 1)]
          : memo
      ),
      [],
    );

  if (knownTranslations.length > 1) {
    throw new Error(`More than one possible translation for skill: ${str}`);
  }

  if (knownTranslations.length === 1) {
    return knownTranslations[0];
  }

  throw new Error(`Unknown skill: ${str}`);
};


const cellsToSkills = (rows, rootCategory, lang) => rows.reduce(
  (memo, row) => (
    (!row[1])
      ? {
        ...memo,
        category: categoryToId(row[0], lang),
      }
      : {
        ...memo,
        skills: {
          ...memo.skills,
          [skillToId(row[0], rootCategory, memo.category, lang)]: parseInt(row[1], 10),
        },
      }
  ),
  { skills: {}, category: undefined },
).skills;


const getProjectSkills = (tokens, lang) => {
  const parsed = tokens.reduce((memo, token) => {
    if (token.type === 'heading' && token.depth === 2) {
      if (/evaluación|evaluacion|assessment/i.test(token.text.trim())) {
        return { ...memo, started: true, ended: false };
      }
      return { ...memo, ended: true };
    }
    if (memo.started && !memo.ended) {
      if (token.type === 'heading' && token.depth === 3) {
        return { ...memo, rootCategory: categoryToId(token.text, lang) };
      }
      if (token.type === 'table' && memo.rootCategory !== 'general') {
        return {
          ...memo,
          skills: {
            ...memo.skills,
            ...cellsToSkills(token.cells, memo.rootCategory, lang),
          },
        };
      }
    }
    return memo;
  }, {
    started: false,
    ended: false,
    rootCategory: undefined,
    skills: {},
  });

  if (!parsed.started) {
    throw new Error('No assessment section found');
  }
  if (!Object.keys(parsed.skills).length) {
    throw new Error('No skills found');
  }


  return parsed.skills;
};


module.exports = (dir, { Project }, opts = {}) => {
  const readme = path.join(dir, 'README.md');
  const basename = path.basename(dir);
  const matches = /^(\d{2})-([a-z-]{1,97})$/.exec(basename);

  if (!matches || matches.length < 3) {
    return Promise.reject(
      Object.assign(
        new Error(`Expected project dir to be in 00-slug format and got ${basename}`),
        { path: path.resolve(dir) },
      ),
    );
  }

  const [prefix, slug] = matches.slice(1);
  const wantedRubricRange = semver.validRange(opts.rubric);

  if (!wantedRubricRange) {
    return Promise.reject(new Error('Invalid rubric version range'));
  }

  if (!semver.satisfies(rubric.version, wantedRubricRange)) {
    return Promise.reject(
      new Error(
        `Parser rubric ${rubric.version} does not satisfy range ${wantedRubricRange}`,
      ),
    );
  }

  const lang = (opts.locale || '').split('-')[0];
  if (Object.keys(rubric.intl).indexOf(lang) === -1) {
    return Promise.reject(
      new Error(
        `Rubric ${rubric.version} does not support language ${lang}`,
      ),
    );
  }

  return readFile(readme, 'utf8')
    .then((text) => {
      const trimmed = (text || '').trim();
      if (!trimmed) {
        throw new Error('Project README.md is empty');
      }
      return marked.lexer(trimmed);
    })
    .then(tokens => ({
      slug,
      repo: opts.repo,
      path: path.relative(process.cwd(), dir),
      version: opts.version,
      parserVersion: pkg.version,
      createdAt: new Date(),
      prefix: parseInt(prefix, 10),
      title: getProjectTitle(tokens),
      rubric: rubric.version,
      locale: opts.locale,
      track: opts.track,
      skills: getProjectSkills(tokens, lang),
    }))
    .then((json) => {
      const project = new Project(json);
      return project.validate().then(() => json);
    })
    .catch((err) => {
      throw Object.assign(err, { path: readme });
    });
};
