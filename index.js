#! /usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { program } from 'commander';
import { parseProject } from './lib/project.js';
import { parseTopic } from './lib/topic.js';
import { parsePart } from './lib/part.js';
import { parseChallenge } from './lib/challenge.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(await fs.readFile(path.join(__dirname, 'package.json')));

const printError = (err, opts) => {
  if (!err) {
    return;
  }

  // Only print leaf nodes (erros may contain child errors)
  if (!err.errors?.length) {
    if (opts.debug) {
      console.error(err);
    } else {
      console.error(err.message);
      if (err.path) {
        console.error(`└── ${err.path}`);
      }
    }
  }

  err.errors?.forEach(item => printError(
    Object.assign(item, { path: item.path || err.path }),
    opts,
  ));
};

const createHandler = fn => (dir, opts) => fn(dir, opts, pkg)
  .then((result) => {
    if (!result) {
      return;
    }
    console.log(JSON.stringify(result, null, 2));
  })
  .catch((err) => {
    printError(Object.assign(err, { path: err.path || dir }), opts);
    process.exit(1);
  });

program.version(pkg.version, '-V');

program.command('project')
  .description('Parse a project')
  .argument('<dir>', 'path to project directory')
  .option('--repo <string>', 'Repository')
  .option('--version <string>', 'Project version')
  .option('--lo <string>', 'Path to yml file with reference learning objectives')
  .option('--debug', 'Show error stack traces')
  .action(createHandler(parseProject));

program.command('topic')
  .description('Parse a topic')
  .argument('<dir>', 'path to topic directory')
  .option('--repo <string>', 'Repository')
  .option('--version <string>', 'Topic version')
  .option('--debug', 'Show error stack traces')
  .action(createHandler(parseTopic));

program.command('part')
  .description('Parse a part')
  .argument('<dir>', 'path to part directory')
  .option('--repo <string>', 'Repository')
  .option('--version <string>', 'Part version')
  .option('--debug', 'Show error stack traces')
  .action(createHandler(parsePart));

program.command('challenge')
  .description('Parse a challenge')
  .argument('<dir>', 'path to challenge directory')
  .option('--repo <string>', 'Repository')
  .option('--version <string>', 'Challenge version')
  .option('--debug', 'Show error stack traces')
  .action(createHandler(parseChallenge));

program.parse();
