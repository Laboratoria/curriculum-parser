'use strict';


const Fs = require('fs');
const Path = require('path');

exports.fixturesBasePath = Path.join(__dirname, 'fixtures');

exports.resolveFixturePath = name => Path.join(exports.fixturesBasePath, name);

exports.resolveFixtureDirReadmePath = name => Path.join(__dirname, 'fixtures', name, 'README.md');

exports.readFixtureFile = name =>
  Fs.readFileSync(exports.resolveFixturePath(name), 'utf8');
