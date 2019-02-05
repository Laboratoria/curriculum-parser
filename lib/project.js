const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const marked = require('marked');
const { validate } = require('models');
const { hasOwnProperty } = require('./common');
const pkg = require('../package.json');


const readFile = promisify(fs.readFile);


const headingsMapToId = {
  evaluación: 'assessment',
};


const getProjectTitle = tokens => tokens[0].text;


const categoriesMapToId = {
  general: 'general',
  tech: 'frontEnd',
  'habilidades técnicas front-end': 'frontEnd',
  'habilidades técnicas ux': 'ux',
  ux: 'ux',
  'habilidades blandas': 'softSkills',
  '**cs**': 'cs',
  '**scm**': 'scm',
  '**javascript**': 'js',
  '**html**': 'html',
  '**css**': 'css',
  '**autogestión**': 'selfManagement',
  '**relaciones interpersonales**': 'interpersonalRelationships',
};


const categoryToId = (str) => {
  const key = str.trim().toLowerCase();
  if (hasOwnProperty(categoriesMapToId, key)) {
    return categoriesMapToId[key];
  }
  console.warn('categoryToId', key);
  return str;
};


const skillsMapToId = {
  'softSkills/selfManagement/planificación y organización': 'softPlanning',
  'softSkills/selfManagement/autoaprendizaje': 'selfLearning',
  'softSkills/selfManagement/presentaciones': 'presentations',
  'softSkills/selfManagement/adaptabilidad': 'adaptability',
  'softSkills/selfManagement/solución de problemas': 'problemSolving',
  'softSkills/interpersonalRelationships/trabajo en equipo': 'teamWork',
  'softSkills/interpersonalRelationships/dar y recibir feedback': 'feedback',
  'softSkills/interpersonalRelationships/comunicación eficaz': 'communication',
  'frontEnd/cs/lógica': 'logic',
  'frontEnd/cs/arquitectura': 'architecture',
  'frontEnd/cs/patrones/paradigmas': 'softwareDesign',
  'frontEnd/scm/git': 'git',
  'frontEnd/scm/github': 'github',
  'frontEnd/js/estilo': 'jsStyle',
  'frontEnd/js/nomenclatura/semántica': 'jsSemantics',
  'frontEnd/js/funciones/modularidad': 'modularity',
  'frontEnd/js/estructuras de datos': 'dataStructures',
  'frontEnd/js/tests': 'jsTesting',
  'frontEnd/html/validación': 'htmlValidation',
  'frontEnd/html/estilo': 'htmlStyle',
  'frontEnd/html/semántica': 'htmlSemantics',
  'frontEnd/css/dry': 'cssDry',
  'frontEnd/css/responsive': 'cssResponsive',
  'user centricity': 'userCentricity',
  'visual design': 'visualDesign',
};


const skillToId = (str, rootCategory, category) => {
  const key = str.trim().toLowerCase();
  if (hasOwnProperty(skillsMapToId, key)) {
    return skillsMapToId[key];
  }
  if (rootCategory && category && hasOwnProperty(skillsMapToId, `${rootCategory}/${category}/${key}`)) {
    return skillsMapToId[`${rootCategory}/${category}/${key}`];
  }
  // if (rootCategory && category) {
  //   console.warn('skillToId', `${rootCategory}/${category}/${key}`);
  // } else if (category) {
  //   console.warn('skillToId', `${category}/${key}`);
  // } else {
  //   console.warn('skillToId', `${key}`);
  // }

  return key;
};


const cellsToSkills = (rows, rootCategory) => rows.reduce(
  (memo, row) => (
    (!row[1])
      ? {
        ...memo,
        category: categoryToId(row[0]),
      }
      : {
        ...memo,
        skills: {
          ...memo.skills,
          [skillToId(row[0], rootCategory, memo.category)]: parseInt(row[1], 10),
        },
      }
  ),
  { skills: {}, category: undefined },
).skills;


const getProjectSkills = (tokens) => {
  const parsed = tokens.reduce((memo, token) => {
    if (token.type === 'heading' && token.depth === 2) {
      if (headingsMapToId[token.text.toLowerCase()] === 'assessment') {
        return { ...memo, started: true, ended: false };
      }
      return { ...memo, ended: true };
    }
    if (memo.started && !memo.ended) {
      if (token.type === 'heading' && token.depth === 3) {
        return { ...memo, rootCategory: categoryToId(token.text) };
      }
      if (token.type === 'table' && memo.rootCategory !== 'general') {
        return {
          ...memo,
          skills: {
            ...memo.skills,
            ...cellsToSkills(token.cells, memo.rootCategory),
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

  return parsed.skills;
};


module.exports = (dir, opts = {}) => {
  const readme = path.join(dir, 'README.md');
  const [prefix, ...parts] = path.basename(dir).split('-');
  const slug = parts.join('-');

  return readFile(readme, 'utf8')
    .then(text => marked.lexer(text || ''))
    .then(tokens => ({
      slug,
      repo: opts.repo,
      path: path.relative(process.cwd(), dir),
      version: opts.version,
      parserVersion: pkg.version,
      createdAt: new Date(),
      prefix: parseInt(prefix, 10),
      title: getProjectTitle(tokens),
      rubric: `${opts.rubric}`.split('.')[0],
      locale: opts.locale,
      track: opts.track,
      skills: getProjectSkills(tokens),
    }))
    .then(json => validate('Project', json).then(() => json));
};
