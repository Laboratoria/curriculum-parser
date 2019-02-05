#! /usr/bin/env node

const minimist = require('minimist');
const chalk = require('chalk');
const { hasOwnProperty } = require('./lib/common');
const pkg = require('./package.json');


const commands = [
  'help',
  'topic',
  'project',
].reduce((memo, key) => ({
  ...memo,
  [key]: require(`./cmd/${key.split(':').join('/')}`),
}), {});


const success = (value) => {
  if (value) {
    console.log(typeof value !== 'string' ? JSON.stringify(value, null, 2) : value);
  }
  process.exit(0);
};


const error = (err) => {
  console.error(chalk.red(err.message));

  if (err.name === 'ValidationError') {
    console.error('');
    Object.keys(err.errors).forEach((key) => {
      console.error(`${chalk.bold.red(key)}: ${err.errors[key].message}`);
    });
  }

  process.exit(1);
};


module.exports = (args, opts) => {
  const cmdName = (opts.h || opts.help) ? 'help' : args.shift() || 'help';

  if (opts.V) {
    return success(pkg.version);
  }

  if (!hasOwnProperty(commands, cmdName)) {
    return error('Unkown command');
  }

  if (opts.h || opts.help || cmdName === 'help') {
    return commands.help({ pkg, commands })
      .then(success, error);
  }

  const requiredArgs = (commands[cmdName].args || []).reduce(
    (memo, arg) => (arg.required ? memo + 1 : memo),
    0,
  );

  if (args.length < requiredArgs) {
    return error('Insufficient arguments');
  }

  return commands[cmdName]({
    pkg,
    commands,
    args,
    opts,
  })
    .then(success)
    .catch(error);
};


if (require.main === module) {
  const { _: args, ...opts } = minimist(process.argv.slice(2));
  module.exports(args, opts);
}
