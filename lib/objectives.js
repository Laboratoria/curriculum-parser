import yaml from 'js-yaml';
import { readFile } from 'node:fs/promises';
import { flattenLearningObjectives } from './project.js';
// import { detectLangs } from './common.js';

export const loadYaml = async fname => (
  yaml.load(await readFile(fname, 'utf8'))
);

const learningObjectivesByLanguage = async (langs, dir) => {
  const localized = await Promise.all(langs.map(async lang => loadYaml(`${dir}/intl/${lang}.yml`)));
  return localized.reduce((accum, objectives, i) => Object.assign(accum, {
    [langs[i]]: {
      yamlObject: objectives,
      flattened: flattenLearningObjectives(objectives),
    },
  }), {});
  // result { es: { yamlObject: {}, flattened: [] }, pt: { yaml: {}, flattened: [] }}
};

export const parseLearningObjectives = async (dir, opts) => {
  const objectivesDefined = flattenLearningObjectives(await loadYaml(`${dir}/data.yml`));

  // Note: tried to use detectLangs but it only works with readmes
  // const langs = await detectLangs(dir);
  const langs = ['es', 'pt'];

  const objectivesByLanguage = await learningObjectivesByLanguage(langs, dir);
  // eslint-disable-next-line max-len
  const { missing: missingObjectives, noTitle: objectivesNoTitle } = objectivesDefined.reduce((accum, objective) => {
    const { missing, noTitle } = accum;
    Object.keys(objectivesByLanguage).forEach((lang) => {
      const { yamlObject, flattened } = objectivesByLanguage[lang];
      if (!flattened.find(o => o === objective)) {
        if (missing[objective]) {
          missing[objective].push(lang);
        } else {
          missing[objective] = [lang];
        }
      } else if (!yamlObject[objective]) {
        // rather than an empty object, a yaml entry without a title just wont exist
        if (noTitle[objective]) {
          noTitle[objective].push(lang);
        } else {
          noTitle[objective] = [lang];
        }
      }
    });
    return { missing, noTitle };
  }, { missing: {}, noTitle: {} });

  const objectivesNotFound = Object.keys(missingObjectives);
  if (objectivesNotFound.length > 0) {
    console.log(`The following ${objectivesNotFound.length} objectives are not found in intl files:`);
    objectivesNotFound.forEach((objective) => {
      console.warn(`Missing objective: ${objective} for langs ${missingObjectives[objective].join(', ')}`);
    });
  }
  const objectivesWithoutTitle = Object.keys(objectivesNoTitle);
  if (objectivesWithoutTitle.length > 0) {
    console.log(`The following ${objectivesWithoutTitle.length} objectives are missing titles in intl files:`);
    objectivesWithoutTitle.forEach((objective) => {
      console.warn(`Missing title for objective: ${objective} for langs ${objectivesNoTitle[objective].join(', ')}`);
    });
  }
};
