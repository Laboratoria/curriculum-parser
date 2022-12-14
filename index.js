#! /usr/bin/env node

import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import chalk from 'chalk';
import minimist from 'minimist';
import * as help from './cmd/help.js';
import * as project from './cmd/project.js';
import * as topic from './cmd/topic.js';

const commands = {
  help,
  topic,
  project,
};

const success = (value) => {
  if (value) {
    console.log(typeof value !== 'string' ? JSON.stringify(value, null, 2) : value);
  }
  process.exit(0);
};

const error = (err) => {
  if (err.path) {
    console.error(err.path);
    console.error(`└── ${chalk.red(err.message)}`);
  } else {
    console.error(chalk.red(err.message));
  }

  if (err.name === 'ValidationError') {
    console.error('');
    Object.keys(err.errors).forEach((key) => {
      console.error(`${chalk.bold.red(key)}: ${err.errors[key].message}`);
    });
  }

  process.exit(1);
};

export const main = async (args, opts) => {
  const pkg = JSON.parse(await fs.readFile('./package.json'));
  const cmdName = (opts.h || opts.help) ? 'help' : args.shift() || 'help';

  if (opts.V) {
    return pkg.version;
  }

  if (typeof commands[cmdName]?.cmd !== 'function') {
    throw new Error('Unknown command');
  }

  if (opts.h || opts.help || cmdName === 'help') {
    return commands.help.cmd({ pkg, commands });
  }

  const requiredArgs = (commands[cmdName].args || []).reduce(
    (memo, arg) => (arg.required ? memo + 1 : memo),
    0,
  );

  if (args.length < requiredArgs) {
    throw new Error('Insufficient arguments');
  }

  return commands[cmdName].cmd({
    pkg,
    commands,
    args,
    opts,
  });
};

if (import.meta.url.startsWith('file:')) {
  const modulePath = fileURLToPath(import.meta.url);
  if (process.argv[1] === modulePath) {
    const { _: args, ...opts } = minimist(process.argv.slice(2));
    main(args, opts)
      .then(success)
      .catch(error);
  }
}
