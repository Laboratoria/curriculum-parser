'use strict';


const Path = require('path');
const CourseParser = require('../');


describe('CourseParser', () => {

  it('should...', (done) => {
    CourseParser([], {}, (err, courses) => {
      console.log(err, courses);
      done();
    });
  });

  it('should...', (done) => {
    CourseParser(['foo'], {}, (err, courses) => {
      console.log(err, courses);
      done();
    });
  });

});
