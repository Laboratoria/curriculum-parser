'use strict';


const Fs = require('fs');
const Path = require('path');


exports.resolveFixturePath = name => Path.join(__dirname, 'fixtures', name);

exports.resolveFixtureDirReadmePath = name => Path.join(__dirname, 'fixtures', name, 'README.md');

exports.readFixtureFile = name =>
  Fs.readFileSync(exports.resolveFixturePath(name), 'utf8');
