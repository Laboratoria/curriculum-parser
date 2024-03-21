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
    const { missingIntl, noTitle } = accum;
    Object.keys(intlObjectives).forEach((lang) => {
      const { tree, flat } = intlObjectives[lang];

      if (!flat.find(o => o === defined)) {
        if (missingIntl[defined]) {
          missingIntl[defined].push(lang);
        } else {
          missingIntl[defined] = [lang];
        }
      } else if (!tree[defined]?.title) {
        if (noTitle[defined]) {
          noTitle[defined].push(lang);
        } else {
          noTitle[defined] = [lang];
        }
      }
    });
    return { missingIntl, noTitle };
  }, { missingIntl: {}, noTitle: {} });


export const parseLearningObjectives = async (dir, opts = {}) => {
  const tree = await loadYaml(`${dir}/data.yml`);
  const flat = flattenLearningObjectives(tree);

  // Note: tried to use detectLangs but it only works with readmes :\
  // const langs = await detectLangs(dir);
  const langs = ['es', 'pt'];
  const intl = await learningObjectivesByLanguage(langs, dir);

  if (opts.validate) {
    const invalidatedObjectives = findMissingObjectives(flat, intl);
    const { missingIntl, noTitle } = invalidatedObjectives;

    const noTitleObjectives = Object.keys(noTitle);
    // if we are strictly checking, we only want objectives missing in all langs
    const missingIntlObjectives = opts.strict
      ? Object.keys(missingIntl).filter(obj => missingIntl[obj].length === langs.length)
      : Object.keys(missingIntl);

    if (missingIntlObjectives.length || noTitleObjectives.length) {
      const messageOutput = [];
      messageOutput.push('Found the following learning objectives with problems:');

      messageOutput.push(
        `==> ${missingIntlObjectives.length} learning objectives missing from ${opts.strict
          ? 'all' : 'at least one'} intl yml:`,
      );
      const intlErrors = missingIntlObjectives.reduce((acc, objective) => {
        acc.push(`* ${objective} missing in langs: ${missingIntl[objective]}`);
        return acc;
      }, []);
      messageOutput.push(
        ...intlErrors,
        '------------',
      );
      messageOutput.push(
        `==> ${noTitleObjectives.length} learning objectives without title:`,
      );
      const titleErrors = noTitleObjectives.reduce((acc, objective) => {
        acc.push(`* ${objective} has no title in langs: ${noTitle[objective]}`);
        return acc;
      }, []);
      messageOutput.push(
        ...titleErrors,
        '------------',
      );

      throw Object.assign(
        new Error(messageOutput.join('\n')),
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
