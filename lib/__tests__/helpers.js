import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const fixturesBasePath = path.join(__dirname, '__fixtures__');

export const resolveFixturePath = name => path.join(fixturesBasePath, name);

export const resolveFixtureDirReadmePath = name => path.join(
  fixturesBasePath,
  name,
  'README.md',
);

export const readFixtureFile = name => fs.readFileSync(
  resolveFixturePath(name),
  'utf8',
);
