import path from 'node:path';
import { parseProject } from '../lib/project.js';

export const cmd = ({ args, opts, pkg }) => parseProject(
  path.resolve(args.shift()),
  opts,
  pkg,
);

export const args = [
  { name: 'dir', required: true },
];

export const options = [
  { name: 'repo', required: true },
  { name: 'version', required: true },
  { name: 'track', required: true },
  { name: 'lo', required: false },
];
