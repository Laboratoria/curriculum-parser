# curriculum-parser

Command line tool used to parse content written in markdown for our LMS at
@Laboratoria ([curricula-js](https://github.com/Laboratoria/curricula-js),
[curricula-ux](https://github.com/Laboratoria/curricula-ux), ...).

[![Build Status](https://travis-ci.com/Laboratoria/curriculum-parser.svg?branch=master)](https://travis-ci.com/Laboratoria/curriculum-parser)

## Installation

You can install `curriculum-parser` using `npm` like this:

```sh
npm i -g Laboratoria/curriculum-parser
```

If you get a permission error please try using `sudo` (you may need admin
permissions depending on your node installation).

```sh
# using `sudo` (only if previous step failed)
sudo npm i -g Laboratoria/curriculum-parser
```

Alternatively you can install using a local clone.

```sh
# clone from your own fork
git clone git@github.com:<your-username>/curriculum-parser.git
cd curriculum-parser
npm install
npm link
```

If the above command fails, try using `sudo`:

```sh
sudo npm link
```

## Upgrade

If you installed using `npm` you can simply re-install like so:

```sh
npm i -g Laboratoria/curriculum-parser
```

If you chose to install using a local clone, you can update your clone to
_upstream_ master:

```sh
# go into local copy of repo
cd curriculum-parser
# if not yet added a reference to upstream remote we add it
git remote add upstream git@github.com:Laboratoria/curriculum-parser.git
# fetch changes and merge upstream/master into local master
git fetch upstream
git merge upstream/master
# you may also want to push changes to your fork
git push origin master
```

## Usage

After installing _globally_ you should have the `curriculum-parser` command
available in your `PATH`.

```text
curriculum-parser <type> <path-to-readme> [options]

Options:

  --validate  When this option is present the output will show validation and
              debugging info instead of JSON.
  --track     The track the course belongs to (`js`, `ux`, `mobile`, ...)
  --locale    The locale/language the content is in (`es-ES` or `pt-BR`).
```

## Examples

### Parse a topic (course) within the curricula-js repo

```sh
curriculum-parser topic topics/babel \
  --repo Laboratoria/curricula-js \
  --version v2.2.0 \
  --track js \
  --locale es-ES \
  > "build/topics/${topic}.json"
```

### Validate???

### Parse a project within the curricula-js repo

```sh
curriculum-parser project projects/01-cipher \
  --repo Laboratoria/curricula-js \
  --version v2.2.0 \
  --rubric 2 \
  --track js \
  --locale es-ES \
  > "build/projects/01-cipher.json"
```

### Parse a topic (course) in the curricula-ux repo

```sh
# ...
```

### Parse a topic (course) in some arbitrary directory

***

NOTE: It should be usable from `curricula-js`, `curricula-ux`, y repos de
corporate training...
