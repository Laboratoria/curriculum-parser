const mongoose = require('mongoose');
const models = require('models')(mongoose);
const helpers = require('./helpers');
const course = require('../lib/course');


describe('course', () => {
  it('should reject with error when dir doesnt exist', () => (
    course('foo', models)
      .catch((err) => {
        expect(err.message).toMatch(/no such file or directory/);
        expect(err.code).toBe('ENOENT');
      })
  ));

  it('should reject when README.md is empty', () => (
    course(helpers.resolveFixturePath('00-course-empty'), models, {
      track: 'js',
      locale: 'es-ES',
    })
      .catch((err) => {
        expect(err.message).toBe('README.md del curso está vacío');
        expect(err.path).toBe(helpers.resolveFixtureDirReadmePath('00-course-empty'));
      })
  ));

  it('should reject when README.md doesnt start with h1', () => (
    course(helpers.resolveFixturePath('01-course-no-title'), models, {
      track: 'js',
      locale: 'es-ES',
    })
      .catch((err) => {
        expect(err.message).toBe('README.md del curso debe empezar con un h1 con el título del curso');
        expect(err.path).toBe(helpers.resolveFixtureDirReadmePath('01-course-no-title'));
      })
  ));

  it('should have empty tags if not found', () => (
    course(helpers.resolveFixturePath('02-course-no-tags'), models, {
      repo: 'Laboratoria/curricula-js',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then(data => expect(data.tags).toMatchSnapshot())
  ));

  it('should read primary (default) tags', () => (
    course(helpers.resolveFixturePath('02-course-tags'), models, {
      repo: 'Laboratoria/curricula-js',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then(data => expect(data.tags).toMatchSnapshot())
  ));

  it('should read main and secondary tags', () => (
    course(helpers.resolveFixturePath('02-course-secondary-tags'), models, {
      repo: 'Laboratoria/curricula-js',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then(data => expect(data.tags).toMatchSnapshot())
  ));

  it('should parse with target audience', () => (
    course(helpers.resolveFixturePath('02-course-with-target-audience'), models, {
      repo: 'Laboratoria/curricula-js',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then((data) => {
        expect(data.tags).toMatchSnapshot();
        expect(data.targetAudience).toMatchSnapshot();
      })
  ));

  it('should parse grades (evaluación) section', () => (
    course(helpers.resolveFixturePath('03-course-with-grades'), models, {
      repo: 'Laboratoria/curricula-js',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then(data => expect(data.grades).toMatchSnapshot())
  ));

  it('should trim <hr> from html fragments', () => (
    course(helpers.resolveFixturePath('03-course-with-grades'), models, {
      repo: 'Laboratoria/curricula-js',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then(data => expect(data.product).toMatchSnapshot())
  ));

  it('should validate units and parts', () => (
    course(helpers.resolveFixturePath('course-with-invalid-unit'), models, {
      repo: 'Laboratoria/curricula-js',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .catch((err) => {
        expect(err.name).toBe('ValidationError');
        expect(err.message)
          .toBe('TopicUnitPart validation failed: type: Path `type` is required.');
      })
  ));
});
