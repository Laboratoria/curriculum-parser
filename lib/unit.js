import { readdir } from 'node:fs/promises';
import path from 'node:path';
import { isDirname } from './common.js';
import part from './part.js'


export default (dir, opts) => readdir(dir)
  .then(files => files.filter(isDirname))
  .then(
    partDirs => Promise.all(
      partDirs.map(partDir => part(path.join(dir, partDir), opts)),
    )
      .then(parts => parts.reduce(
        (memo, item, idx) => ({
          ...memo,
          [partDirs[idx]]: item,
        }),
        {},
      )),
  );
