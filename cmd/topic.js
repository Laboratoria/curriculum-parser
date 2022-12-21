import path from 'node:path';
import course from '../lib/course.js';

export const cmd = app => course(path.resolve(app.args.shift()), app.opts);

export const args = [
  { name: 'dir', required: true },
];

export const options = [
  { name: 'repo', required: true },
  { name: 'version', required: true },
  { name: 'locale', required: true },
  { name: 'track', required: true },
  { name: 'suffix', required: false },
];
