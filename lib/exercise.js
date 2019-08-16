const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const { parseReadme, getReadmeFileName } = require('./common');


const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const readFile = promisify(fs.readFile);


const reduceFileObjects = (dir, json) => json.reduce(
  (memo, item) => ({
    ...memo,
    [Buffer.from(item.path.replace(dir, '').slice(1)).toString('base64')]: (
      (item.content)
        ? item.content
        : reduceFileObjects(item.path, item.children)
    ),
  }),
  {},
);


const dirToJSON = dir => readdir(dir)
  .then(files => Promise.all(
    files.map(
      file => stat(path.join(dir, file))
        .then(statResult => (
          (statResult.isDirectory())
            ? dirToJSON(path.join(dir, file))
              .then(children => ({ path: path.join(dir, file), children }))
            : readFile(path.join(dir, file), 'utf8')
              .then(content => ({ path: path.join(dir, file), content }))
        )),
    ),
  ));


module.exports = (dir, opts = {}) => {
  const slug = path.basename(dir);

  return dirToJSON(dir)
    .then((json) => {
      const filesObj = reduceFileObjects(dir, json);
      const readmeKey = Buffer.from(getReadmeFileName(opts.locale)).toString('base64');
      const { [readmeKey]: readme, ...files } = filesObj;

      if (!readme) {
        throw Object.assign(new Error('Empty or missing exercise README.md'), {
          path: dir,
          type: 'exercise',
        });
      }

      const parsedReadme = parseReadme(readme, {
        environment: 'env',
        entorno: 'env',
        env: 'env',
      });

      return { slug, ...parsedReadme, files };
    });
};
