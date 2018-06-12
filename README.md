# course-parser

Command line tool used to parse content written in markdown for our LMS at
@Laboratoria ([curricula-js](https://github.com/Laboratoria/curricula-js),
[curricula-ux](https://github.com/Laboratoria/curricula-ux), ...).

[![Build Status](https://travis-ci.com/Laboratoria/course-parser.svg?branch=master)](https://travis-ci.com/Laboratoria/course-parser)

## Installation

You can install `course-parser` using `npm` like this:

```sh
npm i -g Laboratoria/course-parser
```

If you get a permission error please try using `sudo` (you may need admin
permissions depending on your node installation).

```sh
# using `sudo` (only if previous step failed)
sudo npm i -g Laboratoria/course-parser
```

Alternatively you can install using a local clone.

```sh
# clone from your own fork
git clone git@github.com:<your-username>/course-parser.git
cd course-parser
yarn install
npm link
```

If the last command files try using `sudo`:

```sh
sudo npm link
```

## Upgrade

If you installed using `npm` you can simply re-install like so:

```sh
npm i -g Laboratoria/course-parser
```

If you chose to install using a local clone, you can update your clone to
_upstream_ master:

```sh
# go into local copy of repo
cd course-parser
# if not yet added a reference to upstream remote we add it
git remote add upstream git@github.com:Laboratoria/course-parser.git
# fetch changes and merge upstream/master into local master
git fetch upstream
git merge upstream/master
# you may also want to push changes to your fork
git push origin master
```

## Usage

After installing _globally_ you should have the `course-parser` command
available in your `PATH`.

```text
course-parser <path-to-readme> [options]

Options:

  --validate  When this option is present the output will show validation and
              debugging info instead of JSON.
  --track     The track the course belongs to (`js`, `ux`, `mobile`, ...)
  --locale    The locale/language the content is in (`es-ES` or `pt-BR`).
```

Ejemplos:

```sh
# create JSON representation of course
course-parser topics/javascript/README.md --track=js --locale=es-ES

# validate course structure and format
course-parser topics/javascript/README.md --track=js --locale=es-ES --validate

# validate all courses in a given directory (each course in a subdirectory)
course-parser topics/*/README.md --track=js --locale=es-ES --validate
```
