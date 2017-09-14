'use strict';


const Helpers = require('./helpers');
const Course = require('../lib/course');


describe('Course(path, cb)', () => {

  it('should log error when README.md is empty', done => Course(
    Helpers.resolveFixtureDirReadmePath('00-course-empty'),
    (err, data) => {
      expect(err).toBe(null);
      expect(data.result.slug).toBe('course-empty');
      expect(data.result.order).toBe(0);
      expect(data.log.length).toBe(1);
      expect(data.log[0]).toEqual([
        Helpers.resolveFixtureDirReadmePath('00-course-empty'),
        'error',
        'README.md del curso course-empty está vacío!'
      ]);
      done();
    }
  ));

  it('should log error when README.md doesnt start with h1', done => Course(
    Helpers.resolveFixtureDirReadmePath('01-course-no-title'),
    (err, data) => {
      expect(err).toBe(null);
      expect(data.result.slug).toBe('course-no-title');
      expect(data.result.order).toBe(1);
      expect(data.log.length).toBe(1);
      expect(data.log[0]).toEqual([
        Helpers.resolveFixtureDirReadmePath('01-course-no-title'),
        'error',
        'README.md del curso course-no-title debe empezar con un h1 con el título del curso!'
      ]);
      done();
    }
  ));

  it('should have empty tags if not found', done => Course(
    Helpers.resolveFixtureDirReadmePath('02-course-no-tags'),
    (err, data) => {
      expect(err).toBe(null);
      expect(data.result.order).toBe(2);
      expect(data.result.tags).toEqual({ primary: [], secondary: [] });
      done();
    }
  ));

  it('should read primary (default) tags', done => Course(
    Helpers.resolveFixtureDirReadmePath('02-course-tags'),
    (err, data) => {
      expect(err).toBe(null);
      expect(data.result.order).toBe(2);
      expect(data.result.tags).toEqual({ primary: ['foo', 'bar', 'baz'], secondary: [] });
      done();
    }
  ));

  it('should read main and secondary tags', done => Course(
    Helpers.resolveFixtureDirReadmePath('02-course-secondary-tags'),
    (err, data) => {
      expect(err).toBe(null);
      expect(data.result.order).toBe(2);
      expect(data.result.tags).toMatchSnapshot();
      done();
    }
  ));

  it('should parse with target audience', done => Course(
    Helpers.resolveFixtureDirReadmePath('02-course-with-target-audience'),
    (err, data) => {
      expect(err).toBe(null);
      expect(data.result.order).toBe(2);
      expect(data.result.tags).toEqual({ primary: ['foo', 'bar', 'baz'], secondary: [] });
      expect(data.result.targetAudience).toMatchSnapshot();
      done();
    }
  ));

  it('should parse grades (evaluación) section', done => Course(
    Helpers.resolveFixtureDirReadmePath('03-course-with-grades'),
    (err, data) => {
      expect(err).toBe(null);
      expect(data).toMatchSnapshot();
      done();
    }
  ));

  it('should trim <hr> from html fragments', done => Course(
    Helpers.resolveFixtureDirReadmePath('03-course-with-grades'),
    (err, data) => {
      expect(err).toBe(null);
      expect(data.result.syllabus.pop().description).toMatchSnapshot();
      expect(data.result.product).toMatchSnapshot();
      done();
    }
  ));

});
