const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { isDirname } = require('./common');
const unit = require('./unit');


//
// Read syllabus from filesystem (not from main readme).
//
module.exports = (dir, opts) => promisify(fs.readdir)(dir)
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
