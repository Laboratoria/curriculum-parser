const path = require('path');
const mongoose = require('mongoose');
const models = require('@laboratoria/models')(mongoose);
const rubric = require('@laboratoria/rubric');
const helpers = require('./helpers');
const project = require('../lib/project');


describe('project', () => {
  it('should reject when project dir not in expected format', () => {
    const p = helpers.resolveFixturePath('a-project');
    return project(p, models)
      .catch((err) => {
        expect(err.message).toBe('Expected project dir to be in 00-slug format and got a-project');
        expect(err.path).toBe(p);
      });
  });

  it('should reject when no rubric version specified', () => {
    const p = helpers.resolveFixturePath('01-foo');
    return project(p, models, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
    })
      .catch((err) => {
        expect(err.message).toBe('Invalid rubric version range');
      });
  });

  it('should reject when rubric version not satisfied', () => {
    const p = helpers.resolveFixturePath('01-foo');
    return project(p, models, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
      rubric: '99',
    })
      .catch((err) => {
        expect(err.message)
          .toBe(`Parser rubric ${rubric.version} does not satisfy range >=99.0.0 <100.0.0-0`);
      });
  });

  it('should reject when language not supported by rubric version', () => {
    const p = helpers.resolveFixturePath('01-foo');
    return project(p, models, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'en-GB',
      rubric: '3',
    })
      .catch((err) => {
        expect(err.message).toBe(`Rubric ${rubric.version} does not support language en`);
      });
  });

  it('should reject when dir doesnt exist', () => (
    project('01-foo', models, { rubric: '3', locale: 'es-ES' })
      .catch((err) => {
        expect(err.message).toMatch(/no such file or directory/);
        expect(err.code).toBe('ENOENT');
      })
  ));

  it('should reject when README.md is empty', () => {
    const p = helpers.resolveFixturePath('00-course-empty');
    return project(p, models, { rubric: '3', locale: 'es-ES' })
      .catch((err) => {
        expect(err.message).toBe('Project README.md is empty');
        expect(err.path).toBe(path.join(p, 'README.md'));
      });
  });

  it('should reject when README.md doesnt start with h1', () => {
    const p = helpers.resolveFixturePath('01-a-project-without-a-title');
    const p2 = helpers.resolveFixturePath('01-a-project-without-a-bad-title');
    return project(p, models, { rubric: '3', locale: 'es-ES' })
      .then(() => {
        throw new Error('This should never happen');
      })
      .catch((err) => {
        expect(err.message).toBe('Expected README.md to start with h1 and instead saw heading (depth: 2)');
        expect(err.path).toBe(path.join(p, 'README.md'));

        return project(p2, models, { rubric: '3', locale: 'es-ES' });
      })
      .then(() => {
        throw new Error('This should never happen');
      })
      .catch((err) => {
        expect(err.message).toBe('Expected README.md to start with h1 and instead saw paragraph');
        expect(err.path).toBe(path.join(p2, 'README.md'));
      });
  });

  it('should reject when no assessment section present', () => {
    const p = helpers.resolveFixturePath('01-a-project');
    return project(p, models, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
      rubric: '3',
    })
      .catch((err) => {
        expect(err.message).toBe('No assessment section found');
        expect(err.path).toBe(path.join(p, 'README.md'));
      });
  });

  it('should reject when unknown root skills category', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-unknown-root-skills-cats');
    return project(p, models, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
      rubric: '~3',
    })
      .catch((err) => {
        expect(err.message).toBe('Unknown skills category: Foo');
        expect(err.path).toBe(path.join(p, 'README.md'));
      });
  });

  it('should reject when unknown skills category', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-unknown-skills-cats');
    return project(p, models, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
      rubric: '3',
    })
      .catch((err) => {
        expect(err.message).toBe('Unknown skill: JavaScript');
        expect(err.path).toBe(path.join(p, 'README.md'));
      });
  });

  it('should reject when unknown skill', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-unknown-skill');
    return project(p, models, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'es-ES',
      rubric: '3',
    })
      .catch((err) => {
        expect(err.message).toBe('Unknown skill: Lógicaaa');
        expect(err.path).toBe(path.join(p, 'README.md'));
      });
  });

  it('should parse portuguese project', () => {
    const p = helpers.resolveFixturePath('01-a-project-with-pt-translation');
    return project(p, models, {
      track: 'js',
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      locale: 'pt-BR',
      rubric: '3',
      suffix: 'pt',
    })
      .then((parsed) => {
        expect(parsed.slug).toBe('a-project-with-pt-translation-pt');
        expect(parsed.locale).toBe('pt-BR');
        expect(parsed.skills).toMatchSnapshot();
      });
  });
});
