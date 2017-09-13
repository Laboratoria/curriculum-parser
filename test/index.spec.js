'use strict';


const CourseParser = require('../');


describe('CourseParser(paths, opts, cb)', () => {

  it('should yield { courses: {}, log: [] } for empty paths', (done) => {
    CourseParser([], {}, (err, data) => {
      expect(err).toBe(null);
      expect(data).toEqual({ courses: {}, log: [] });
      done();
    });
  });

  it('should yield error when path doesnt exist', (done) => {
    CourseParser(['foo'], {}, (err, data) => {
      expect(err).toMatchSnapshot();
      expect(data).toBe(undefined);
      done();
    });
  });

});
