const fs = require('fs');
const path = require('path');

exports.fixturesBasePath = path.join(__dirname, 'fixtures');

exports.resolveFixturePath = name => path.join(exports.fixturesBasePath, name);

exports.resolveFixtureDirReadmePath = name => path.join(
  exports.fixturesBasePath,
  name,
  'README.md',
);

exports.readFixtureFile = name => fs.readFileSync(
  exports.resolveFixturePath(name),
  'utf8',
);
