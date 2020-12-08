const path = require('path');
const project = require('../lib/project');


module.exports = app => project(
  path.resolve(app.args.shift()),
  app.models,
  app.opts,
);


module.exports.args = [
  { name: 'dir', required: true },
];

module.exports.options = [
  { name: 'repo', required: true },
  { name: 'version', required: true },
  { name: 'locale', required: true },
  { name: 'track', required: true },
  { name: 'lo', required: false },
  { name: 'suffix', required: false },
];
