# @laboratoria/curriculum-parser

Command line tool used to parse content written in markdown at
@Laboratoria (See [Laboratoria/bootcamp](https://github.com/Laboratoria/bootcamp)).

![Node.js CI](https://github.com/Laboratoria/curriculum-parser/workflows/Node.js%20CI/badge.svg)
[![Coverage Status](https://coveralls.io/repos/github/Laboratoria/curriculum-parser/badge.svg?branch=main)](https://coveralls.io/github/Laboratoria/curriculum-parser?branch=main)

## Installation

Install as a development dependency in your project:

```sh
npm i --save-dev @laboratoria/curriculum-parser
```

You should now be able to run it with `npx`:

```sh
npx curriculum-parser # when already installed in project

# or alternatively using full package name (with org)
# this works even if not previously installed.
npx @laboratoria/curriculum-parser
```

You can also install `curriculum-parser` _globally_ using `npm` like this:

```sh
npm i -g @laboratoria/curriculum-parser
```

If you get a permission error please try using `sudo` (you may need admin
permissions depending on your node installation).

```sh
# using `sudo` (only if previous step failed)
sudo npm i -g @laboratoria/curriculum-parser
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

If you installed _globally_ using `npm` you can simply re-install like so:

```sh
npm i -g @laboratoria/curriculum-parser
```

If you chose to install using a local clone, you can update your clone to
_upstream_ main:

```sh
# go into local copy of repo
cd curriculum-parser
# if not yet added a reference to upstream remote we add it
git remote add upstream git@github.com:Laboratoria/curriculum-parser.git
# fetch changes and merge upstream/main into local main
git fetch upstream
git merge upstream/main
# you may also want to push changes to your fork
git push origin main
```

## Usage

After installing _globally_ (or _linking_ with `npm link`) you should have the
`curriculum-parser` command available in your `PATH`.

```text

Usage: curriculum-parser [command] [options]

Commands:

  help
  topic <dir> --repo --version --locale --track [--suffix]
  project <dir> --repo --version --locale --track [--lo=some/dir] [--suffix]

Global options:

  -h, --help        Show help
  -V                Show version

```

## Examples

### Parse a topic (course) within the `Laboratoria/bootcamp` repo

```sh
curriculum-parser topic topics/javascript \
  --repo Laboratoria/bootcamp \
  --version 2.5.0 \
  --locale es-ES \
  --track js \
  > "build/topics/javascript.json"
```

### Parse a portuguese topic (course) within the `Laboratoria/bootcamp` repo

```sh
curriculum-parser topic topics/javascript \
  --repo Laboratoria/bootcamp \
  --version 2.5.0 \
  --locale pt-BR \
  --track js \
  --suffix pt \
  > "build/topics/javascript-pt.json"
```

### Parse a project within the `Laboratoria/bootcamp` repo

```sh
curriculum-parser project projects/01-cipher \
  --repo Laboratoria/bootcamp \
  --version 2.5.0 \
  --locale es-ES \
  --track js \
  --lo=./learning-objectives \
  > "build/projects/01-cipher.json"
```

### Parse a portuguese project within the `Laboratoria/bootcamp` repo

```sh
curriculum-parser project projects/01-cipher \
  --repo Laboratoria/bootcamp \
  --version 2.5.0 \
  --locale pt-BR \
  --track js \
  --suffix pt \
  --lo=./learning-objectives \
  > "build/projects/01-cipher-pt.json"
```

### Parse a topic (course) in the curricula-ux repo

```sh
curriculum-parser topic 00-topics/00-intro-ux \
  --repo Laboratoria/curricula-ux \
  --version 1.0.0 \
  --track ux \
  --locale es-ES
```

### Parse a topic (course) in some arbitrary directory

```sh
curriculum-parser topic . \
  --repo some-github-user/some-github-repo \
  --path . \
  --version 1.0.0 \
  --track business \
  --locale es-ES
```
