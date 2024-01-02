import yaml from 'js-yaml';
import { readFile } from 'node:fs/promises';
import { flattenLearningObjectives } from './project.js';
// import { detectLangs } from './common.js';

export const loadYaml = async fname => (
  yaml.load(await readFile(fname, 'utf8'))
);

// returns { es: { tree, flat }, pt: { tree, flat } }
const learningObjectivesByLanguage = async (langs, dir) => {
  const localized = await Promise.all(langs.map(async lang => loadYaml(`${dir}/intl/${lang}.yml`)));
  return localized.reduce((accum, objectives, i) => Object.assign(accum, {
    [langs[i]]: {
      tree: objectives,
      flat: flattenLearningObjectives(objectives),
    },
  }), {});
};

// uses objectives defined in data.yml and compares them
// to the objectives in the intl files
// returns { missing: { objective: [lang] }, noTitle: { objective: [lang] } }
const findMissingObjectives = (definedObjectives, intlObjectives) =>
  // eslint-disable-next-line implicit-arrow-linebreak
  definedObjectives.reduce((accum, defined) => {
    const { missing, noTitle } = accum;
    Object.keys(intlObjectives).forEach((lang) => {
      const { tree, flat } = intlObjectives[lang];

      if (!flat.find(o => o === defined)) {
        if (missing[defined]) {
          missing[defined].push(lang);
        } else {
          missing[defined] = [lang];
        }
      } else if (!tree[defined]?.title) {
        if (noTitle[defined]) {
          noTitle[defined].push(lang);
        } else {
          noTitle[defined] = [lang];
        }
      }
    });
    return { missing, noTitle };
  }, { missing: {}, noTitle: {} });


export const parseLearningObjectives = async (dir, opts) => {
  const tree = await loadYaml(`${dir}/data.yml`);
  const flat = flattenLearningObjectives(tree);

  // Note: tried to use detectLangs but it only works with readmes :\
  // const langs = await detectLangs(dir);
  const langs = ['es', 'pt'];
  const intl = await learningObjectivesByLanguage(langs, dir);

  if (opts.validate) {
    const errors = findMissingObjectives(flat, intl);
    const { missing, noTitle } = errors;
    const errMessages = [];

    if (Object.keys(missing).length > 0) {
      const heading = 'Learning objectives missing from intl:';
      const e = Object.keys(missing).reduce((acc, obj) => {
        if (!opts.strict || missing[obj].length === langs.length) {
          acc.push(`${obj} missing in langs: ${missing[obj]}`);
        }
        return acc;
      }, []);
      errMessages.push(heading, ...e, `==> ${e.length} objectives missing from intl`, '----');
    }
    if (Object.keys(noTitle).length > 0) {
      const heading = `${Object.keys(noTitle).length} Learning objectives without title:`;
      const e = Object.keys(noTitle).reduce((acc, obj) => {
        acc.push(`${obj} has no title in langs: ${noTitle[obj]}`);
        return acc;
      }, []);
      errMessages.push(heading, ...e, `==> ${e.length} objectives missing titles`, '----');
    }
    if (errMessages.length) {
      throw Object.assign(
        new Error(errMessages.join('\n')),
        { path: dir },
      );
    }
  }
  return {
    tree,
    flat,
    intl: Object.keys(intl).reduce((acc, lang) => {
      acc[lang] = intl[lang].tree;
      return acc;
    }, {}),
    table: flat.map(key => ({
      key,
      ...Object.keys(intl).reduce((accum, lang) => Object.assign(accum, {
        [lang]: intl[lang].tree[key]?.title || intl[lang].tree[key],
      }), {}),
    })),
  };
};
