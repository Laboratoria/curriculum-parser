const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const marked = require('marked');
const cheerio = require('cheerio');
const common = require('./common');
const syllabus = require('./syllabus');
const { computeCourseStats } = require('./stats');
const pkg = require('../package.json');


const defaults = () => ({
  title: null,
  description: [],
  tags: [],
  targetAudience: [],
  dependencies: [],
  learningObjectives: [],
  product: [],
  syllabus: [],
  grades: [],
  contributors: [],
  books: [],
  benchmarks: [],
  references: [],
});


const parseSyllabusItemPartTitle = (str) => {
  const matches = /^\[(.*)\]\((.*)\)$/.exec(str);

  if (!matches || matches.length < 3) {
    return { title: str };
  }

  return { title: matches[1], href: matches[2] };
};


const parseSyllabusItemTitle = (str) => {
  const matches = /^(\[BONUS\]\s+)?(((Unidad|Unit|Unidade)\s+\d+):?\s+)?(\[.*\])(\(.*\)).*$/.exec(str);

  if (!matches || matches.length < 7) {
    return {};
  }

  return {
    title: matches[5].slice(1, matches[5].length - 1),
    href: matches[6].slice(1, matches[6].length - 1),
    bonus: !!matches[1],
  };
};


const parseSyllabus = (tokens, links) => tokens
  .reduce((memo, token) => {
    if (token.type === 'heading' && token.depth === 3) {
      memo.push({
        ...parseSyllabusItemTitle(token.text),
        description: [],
        parts: [],
      });
    } else if (token.type === 'table') {
      Object.assign(memo[memo.length - 1], {
        parts: token.cells.map(row => ({
          order: parseInt(row[0], 10),
          type: row[1],
          format: row[2],
          duration: common.parseDuration(row[3]),
          ...parseSyllabusItemPartTitle(row[4]),
        })),
      });
    } else {
      memo[memo.length - 1].description.push(token);
    }

    return memo;
  }, [])
  .map(item => ({
    ...item,
    description: common.tokensToHTML(item.description, links),
  }));


const parseDescription = (tokens, links) => {
  let description = common.tokensToHTML(tokens, links);
  const tags = { primary: {}, secondary: {} };
  const $ = cheerio.load(description);
  let $lastP = $('p').last();

  if (/^Secondary tags:/.test($lastP.text())) {
    tags.secondary = $lastP.find('code').toArray()
      .reduce((memo, el) => ({ ...memo, [$(el).text().toLowerCase()]: true }), {});
    $lastP.remove();
    $lastP = $('p').last();
  }

  if (/^(Tags|Main tags):/.test($lastP.text())) {
    tags.primary = $lastP.find('code').toArray()
      .reduce((memo, el) => ({ ...memo, [$(el).text().toLowerCase()]: true }), {});
    $lastP.remove();
  }

  description = $('body').html();

  return { description, tags };
};


const parseTokens = (tokens) => {
  let currSection = 'title';

  return tokens.reduce(
    (memo, token) => {
      if (token.type === 'heading' && token.depth === 1) {
        currSection = 'description';
        return { ...memo, title: token.text };
      }
      if (token.type === 'heading' && token.depth === 2) {
        if (/(Público objetivo|Target audience|Público alvo)/i.test(token.text)) {
          currSection = 'targetAudience';
        } else if (/(Requerimientos previos|Previous knowledge|Pré-requisitos)/i.test(token.text)) {
          currSection = 'dependencies';
        } else if (/(Aprenderás|Learning objectives|Você vai aprender)/i.test(token.text)) {
          currSection = 'learningObjectives';
        } else if (/(producto|proyecto|product|project|produto)/i.test(token.text)) {
          currSection = 'product';
        } else if (token.text === 'Syllabus') {
          currSection = 'syllabus';
        } else if (/(evaluación|assessment|avaliação)/i.test(token.text)) {
          currSection = 'grades';
        } else if (/(Contributors|Autor|Colaborador|Contribuidor)/i.test(token.text)) {
          currSection = 'contributors';
        } else if (/(Libros|Books|Livros)/i.test(token.text)) {
          currSection = 'books';
        } else if (/(benchmarks)/i.test(token.text)) {
          currSection = 'benchmarks';
        } else if (/(referencias|lecturas complementarias|Further reading)/i.test(token.text)) {
          currSection = 'references';
        } else {
          memo[currSection].push(token);
        }
      } else {
        memo[currSection].push(token);
      }

      return memo;
    },
    defaults(),
  );
};


const parseCourseReadme = readme => promisify(fs.readFile)(readme, 'utf8')
  .then(text => marked.lexer(text || ''))
  .then((tokens) => {
    if (!tokens.length) {
      throw Object.assign(new Error('README.md del curso está vacío'), {
        path: readme,
      });
    }

    if (tokens[0].type !== 'heading' || tokens[0].depth !== 1) {
      throw Object.assign(
        new Error('README.md del curso debe empezar con un h1 con el título del curso'),
        { path: readme },
      );
    }

    const parsed = parseTokens(tokens);

    return Object.keys(parsed).reduce((memo, key) => {
      if (key === 'title') {
        return { ...memo, [key]: parsed[key] };
      }
      if (key === 'description') {
        const { description, tags } = parseDescription(parsed[key], tokens.links);
        return { ...memo, [key]: description, tags };
      }
      if (key === 'syllabus') {
        return { ...memo, [key]: parseSyllabus(parsed[key], tokens.links) };
      }
      if (key !== 'tags') {
        return { ...memo, [key]: common.tokensToHTML(parsed[key], tokens.links) };
      }
      return memo;
    }, {});
  });


// mezcla el syllabus leido en el README.md principal con las unidades leídas
// de las subcarpetas
//
// TODO: Here we should check whether the readme's syllabus matches the one
// read from subdirectories.
const merge = (course, syllabusFromSubdirs) => ({
  ...course,
  syllabus: (course.syllabus || []).reduce(
    (memo, { href, ...rest }) => ({
      ...memo,
      [href]: {
        ...rest,
        parts: syllabusFromSubdirs[href],
      },
    }),
    {},
  ),
});


// NOTE: Do we need this if parser already ensures an `order` property?
const getOrderFromSlug = (slug) => {
  const matches = /^(\d{2})-.+$/.exec(slug);
  return (!matches || matches.length < 2)
    ? slug
    : parseInt(matches[1], 10);
};


const sortByDirname = (a, b) => {
  const aOrder = getOrderFromSlug(a);
  const bOrder = getOrderFromSlug(b);
  if (aOrder > bOrder) {
    return 1;
  }
  if (aOrder < bOrder) {
    return -1;
  }
  return 0;
};


const computeUnitsOrder = merged => ({
  ...merged,
  syllabus: Object.keys(merged.syllabus)
    .sort(sortByDirname)
    .reduce(
      (memo, key, idx) => ({
        ...memo,
        [key]: {
          ...merged.syllabus[key],
          order: idx,
          parts: Object.keys(merged.syllabus[key].parts)
            .sort(sortByDirname)
            .reduce(
              (prev, partKey, partIdx) => ({
                ...prev,
                [partKey]: {
                  ...merged.syllabus[key].parts[partKey],
                  order: partIdx,
                },
              }),
              {},
            ),
        },
      }),
      {},
    ),
});


const applyGlobalOptions = (result, opts, relativePath, parserVersion) => ({
  ...result,
  slug: `${result.slug}${opts.suffix ? `-${opts.suffix}` : ''}`,
  repo: opts.repo,
  path: relativePath || '.',
  version: opts.version,
  parserVersion,
  track: opts.track,
  locale: opts.locale,
});


//
// Public API
//


module.exports = (dir, { Topic }, opts = {}) => {
  const readme = path.join(dir, common.getReadmeFileName(opts.locale));
  const relativePath = path.relative(process.cwd(), dir);
  const { slug } = common.parseDirname(readme);

  return Promise.all([parseCourseReadme(readme), syllabus(dir, opts)])
    .then(([course, syllabusFromSubdirs]) => merge(course, syllabusFromSubdirs))
    .then(merged => computeUnitsOrder(merged))
    .then(result => ({ slug, createdAt: new Date(), ...result }))
    .then(result => applyGlobalOptions(
      result,
      opts,
      relativePath,
      pkg.version,
    ))
    .then(json => computeCourseStats(json))
    .then((json) => {
      const topic = new Topic(json);
      return topic.validate().then(() => json);
    });
};


module.exports.printStats = (course) => {
  const unitKeys = Object.keys(course.syllabus);
  console.log(`# ${course.title} (${course.slug})\n`);
  console.log(`Track: ${course.track}`);
  console.log(`Locale: ${course.locale}`);
  console.log(`Duration: ${course.stats.durationString}`);
  console.log(`Units: ${course.stats.unitCount}`);
  console.log(`Parts: ${course.stats.partCount}`);
  console.log(`Exercises: ${course.stats.exerciseCount}\n`);
  unitKeys.forEach((unitKey, unitIdx) => {
    const unit = course.syllabus[unitKey];
    const partKeys = Object.keys(unit.parts || {});
    console.log(`\n## Unit ${unitIdx + 1}: ${unit.title} (${unitKey})\n`);
    console.log(`Duration: ${unit.stats.durationString}`);
    console.log(`Parts: ${unit.stats.partCount}`);
    console.log(`Exercises: ${unit.stats.exerciseCount}\n`);
    partKeys.forEach((partKey) => {
      const part = unit.parts[partKey];
      const extercises = (part.exerciseCount) ? `[ ${Object.keys(part.exerciseCount).length} ejercicio(s) ]` : '';
      if (part.type === 'practice') {
        // console.log(part);
      }
      console.log(`| ${partKey} | ${part.type} | ${part.format} | ${part.durationString} | ${part.title} ${extercises}`);
    });
  });
};
