const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { isDirname } = require('./common');
const part = require('./part');


module.exports = (dir, opts) => promisify(fs.readdir)(dir)
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
