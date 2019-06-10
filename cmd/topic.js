const path = require('path');
const course = require('../lib/course');


module.exports = app => course(
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
  { name: 'suffix', required: false },
];
