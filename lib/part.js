import path from 'node:path';
import { readdir, readFile } from 'node:fs/promises';
import {
  getReadmeFileName,
  parseReadme,
  parseDuration,
  isDirname,
} from './common.js';
import exercise from './exercise.js';
import quiz from './quiz.js';


const partTypes = {
  read: 'read',
  lectura: 'read',
  leitura: 'read',
  seminar: 'seminar',
  seminario: 'seminar',
  seminário: 'seminar',
  webinar: 'seminar',
  oficina: 'workshop',
  workshop: 'workshop',
  taller: 'workshop',
  quiz: 'quiz',
  practice: 'practice',
  exercício: 'practice',
  práctica: 'practice', // ?????
  cuestionario: 'other', // ????
  producto: 'practice', // ???? Prácticas sin ejercicios del LMS (libres)
  video: 'read', // ???? este sólo aparece en progreso, no en cursos???
};


const partFormats = {
  guided: 'guided',
  guiado: 'guided',
  'self-paced': 'self-paced',
  individual: 'self-paced',
};


export default (dir, opts = {}) => {
  const readmeFileName = getReadmeFileName(opts.locale);
  const readmeAbsPath = path.join(dir, readmeFileName);

  return readdir(dir)
    .then((files) => {
      if (files.indexOf(readmeFileName) === -1) {
        throw new Error('Part is missing README.md');
      }

      return readFile(readmeAbsPath, 'utf8')
        .then(readme => [readme, files]);
    })
    .then(([readme, files]) => {
      const parsedReadme = parseReadme(readme, {
        tipo: 'type',
        type: 'type',
        formato: 'format',
        format: 'format',
        duración: 'duration',
        duration: 'duration',
        duração: 'duration',
      });

      Object.assign(parsedReadme, {
        duration: parseDuration(parsedReadme.duration),
        format: partFormats[parsedReadme.format],
        type: partTypes[parsedReadme.type],
      });

      if (parsedReadme.duration === null) {
        throw new Error('Could not parse part duration');
      }

      if (parsedReadme.type === 'practice') {
        return Promise.all(
          files
            .filter(isDirname)
            .map(file => exercise(path.join(dir, file), opts)),
        )
          .then(all => all.reduce(
            (memo, { slug, ...item }) => ({ ...memo, [slug]: item }),
            {},
          ))
          .then(exercises => (
            (Object.keys(exercises).length > 0)
              ? { ...parsedReadme, exercises }
              : parsedReadme
          ));
      }

      if (parsedReadme.type === 'quiz') {
        return Object.keys(parsedReadme).reduce(
          (memo, key) => (
            (key === 'body')
              ? memo
              : { ...memo, [key]: parsedReadme[key] }
          ),
          {
            questions: quiz(parsedReadme.body),
          },
        );
      }

      return parsedReadme;
    })
    .catch((err) => {
      throw Object.assign(err, { path: readmeAbsPath });
    });
};
