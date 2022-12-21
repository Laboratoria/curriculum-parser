import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { isDirname } from './common.js';
import unit from './unit.js';


//
// Read syllabus from filesystem (not from main readme).
//
export default (dir, opts) => readdir(dir)
  .then(files => files.filter(isDirname))
  .then(
    unitDirs => Promise.all(
      unitDirs.map(unitDir => unit(path.join(dir, unitDir), opts)),
    )
      .then(units => units.reduce(
        (memo, item, idx) => ({
          ...memo,
          [unitDirs[idx]]: item,
        }),
        {},
      )),
  );
