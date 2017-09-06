'use strict';


const Fs = require('fs');
const Path = require('path');
const Async = require('async');
const Common = require('./common');
const Exercise = require('./exercise');
const Quiz = require('./quiz');


const internals = {};


// internals.defaults = () => ({
//   title: null,
//   type: null,
//   format: null,
//   duration: null,
//   learningObjectives: [],
//   body: []
// });


// internals.isFile = (fname, cb) => Fs.exists(fname, (exists) => {
//   if (!exists) {
//     return cb(new Error(`File ${fname} doesnt exist!`));
//   }
//
//   Fs.stat(fname, (err, stat) => {
//     if (err) {
//       return cb(err);
//     }
//
//     if (stat.isDirectory()) {
//       return cb(new Error('Syllabus item part must be a file'));
//     }
//
//     cb(null, true);
//   });
// });


// internals.parsePartLogistics = str => {
//   const matches = /^(Formato|Tipo|Duración):\s+`(\d+(min|h)|(lectura|practice|workshop|quiz))`/.exec(str);
//
//   if (!matches || matches.length < 3) {
//     return {};
//   }
//
//   if (matches[1] === 'Formato') {
//     return { format: matches[2] };
//   }
//   else if (matches[1] === 'Tipo') {
//     return { type: matches[2] };
//   }
//   else if (matches[1] === 'Duración') {
//     return { duration: Common.parseDuration(matches[2]) };
//   }
//
//   return {};
// };


// internals.parsePartFile = (cwd, part, cb) => {
//   //console.log(part);
//   if (!part || !part.href || !/\.md$/.test(part.href)) {
//     return cb(null, part);
//   }
//
//   const fname = Path.join(cwd, part.href);
//
//   Async.series([
//     Async.apply(internals.isFile, fname),
//     Async.apply(internals.parseFile, fname)
//   ], (err, results) => {
//
//     if (err) {
//       console.log(err);
//       return cb(null, part);
//     }
//
//     results[1].body = Common.tokensToHTML(results[1].body, []);
//     results[1].body = internals.parseImages(cwd, part, results[1].body);
//     results[1].body = internals.parseYouTubeVideos(results[1].body);
//
//
//     if (results[1].learningObjectives && results[1].learningObjectives.length) {
//       results[1].learningObjectives = Common.tokensToHTML(results[1].learningObjectives, []);
//     }
//
//     if (results[1].title !== part.title) {
//       results[1].titleAlt = part.title;
//     }
//
//     if (results[1].duration && part.duration && results[1].duration !== part.duration) {
//       console.error(`Warning: Syllabus item part duration mismatch! (${part.title} => ${results[1].duration} !== ${part.duration})`);
//     }
//
//     if (results[1].type && part.type && results[1].type !== part.type) {
//       console.error(`Warning: Syllabus item part type mismatch! (${part.title} => ${results[1].type} !== ${part.type})`);
//     }
//
//     const notNullKeys = Object.keys(results[1]).reduce((memo, key) => {
//
//       if (results[1][key]) {
//         memo[key] = results[1][key];
//       }
//
//       return memo;
//     }, {});
//
//     return cb(null, Object.assign({}, part, notNullKeys));
//   });
// };


// internals.tokensToPart = (currSection = 'title') => (memo, token) => {
//   if (currSection === 'title' && token.type === 'heading' && token.depth === 1) {
//     memo.title = token.text.replace(/^\d+\.\s/, '');
//   }
//   else if (currSection === 'title' && token.type === 'heading' && token.depth === 2 && /objetivos/i.test(token.text)) {
//     currSection = 'learningObjectives';
//   }
//   else if (currSection === 'title' && (!memo.duration || !memo.format) && token.type === 'list_start') {
//     currSection = 'logistics';
//   }
//   else if (currSection === 'logistics' && token.type === 'list_end') {
//     currSection = 'body';
//   }
//   else if (currSection === 'logistics' && token.type === 'text') {
//     Object.assign(memo, internals.parsePartLogistics(token.text));
//   }
//   else if (!memo.body.length && token.type === 'hr') {
//     currSection = 'body';
//   }
//   else if (currSection !== 'logistics') {
//     // Si llegados a este punto todavía estamos en la sección `title` es que el
//     // archivo no contiene nada de metadata antes del `body` y no hay <hr>
//     // explícito demarcando el body, así que saltamos a al body.
//     if (currSection === 'title') {
//       currSection = 'body';
//     }
//     memo[currSection].push(token);
//   }
//
//   return memo;
// };


internals.parseExercises = (path, result, cb) => Async.map(
  result.files.filter(Common.isDirname),
  Exercise(path, result),
  (err, exercises) => {
    if (err) {
      return cb(err);
    }
    cb(null, result);
  }
);


internals.parseReadme = (path, result, data, cb) => {
  const { unitDir, partDir} = result.result;
  const slug = `${unitDir}/${partDir}`;

  try {
    Object.assign(result.result, Common.parseReadme(data, {
      tipo: 'type',
      type: 'type',
      formato: 'format',
      format: 'format',
      duración: 'duration',
      duration: 'duration',
    }));
  }
  catch (err) {
    result.log.push(['error', `${slug} => ${err.message}`]);
  }

  if (result.result.type === 'practice') {
    return internals.parseExercises(path, result, cb);
  }
  else if (result.result.type === 'quiz') {
    result.result.questions = Quiz(result.result.body);
    delete result.result.body;
  }

  cb(null, result);
};


internals.readPartReadme = (path, result, cb) => Fs.readFile(
	Path.join(path, result.result.unitDir, result.result.partDir, 'README.md'),
	'utf8',
	(err, data) =>
    (err && cb(err)) || internals.parseReadme(path, result, data, cb)
);


module.exports = (path, unitDir) => (partDir, cb) => Fs.readdir(
	Path.join(path, unitDir, partDir),
	(err, files) => {
    const result = {
      result: { unitDir, partDir },
      log: [],
      files
    };

		if (err) {
      if (err.code === 'ENOTDIR') {
        result.log.push(['warn', `Expected ${err.path} to be a directory!`]);
        return cb(null, result);
      }
			return cb(err);
		}

		if (files.indexOf('README.md') === -1) {
			result.log.push(['warn', `Part ${unitDir}/${partDir} is missing README.md`]);
			return cb(null, result);
		}

		internals.readPartReadme(path, result, cb);
	}
);
