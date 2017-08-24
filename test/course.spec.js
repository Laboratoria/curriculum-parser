'use strict';


const Path = require('path');
const Assert = require('assert');
const Course = require('../lib/course');


const internals = {};


internals.fixture = name => Path.join(__dirname, 'fixtures', name, 'README.md');


describe('Course', () => {

  it('should log error when README.md is empty', done => Course(
    internals.fixture('00-course-empty'),
    (err, course) => {
      expect(err).toBe(null);
      expect(course.slug).toBe('course-empty');
      expect(course.order).toBe(0);
      expect(course.logs[0]).toEqual(['error', 'README.md del curso course-empty está vacío!']);
      expect(course.parsed).toBe(undefined);
      done();
    }
  ));

  it('should log error when README.md doesnt start with h1', done => Course(
    internals.fixture('01-course-no-title'),
    (err, course) => {
      expect(err).toBe(null);
      expect(course.slug).toBe('course-no-title');
      expect(course.order).toBe(1);
      expect(course.logs[0]).toEqual(['error', 'README.md del curso course-no-title debe empezar con un h1 con el título del curso!']);
      expect(course.parsed).toBe(undefined);
      done();
    }
  ));

  it('should have empty tags if not found', done => Course(
    internals.fixture('02-course-no-tags'),
    (err, course) => {
      expect(err).toBe(null);
      expect(course.order).toBe(2);
      expect(course.parsed.tags).toEqual({ primary: [], secondary: [] });
      done();
    }
  ));

  it('should read primary (default) tags', done => Course(
    internals.fixture('02-course-tags'),
    (err, course) => {
      expect(err).toBe(null);
      expect(course.order).toBe(2);
      expect(course.parsed.tags).toEqual({ primary: ['foo', 'bar', 'baz'], secondary: [] });
      done();
    }
  ));

  it('should read main and secondary tags', done => Course(
    internals.fixture('02-course-secondary-tags'),
    (err, course) => {
      expect(err).toBe(null);
      expect(course.order).toBe(2);
      expect(course.parsed.tags).toMatchSnapshot();
      console.log(course.parsed.tags);
      done();
    }
  ));

  it.skip('should...', done => Course(
    internals.fixture('02-course'),
    (err, course) => {
      expect(err).toBe(null);
      expect(course.order).toBe(2);
      expect(course.parsed.tags).toEqual({ primary: ['foo', 'bar', 'baz'], secondary: [] });
      console.log(course.parsed.tags);
      done();
    }
  ));

});
