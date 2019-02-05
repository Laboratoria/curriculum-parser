const syllabus = require('../lib/syllabus');
const helpers = require('./helpers');


describe('syllabus', () => {
  it('should be a function', () => {
    expect(typeof syllabus).toBe('function');
  });

  it.skip('should parse syllabus from subdirectories', () => (
    syllabus(helpers.resolveFixturePath('01-course-no-title'))
      .then(console.log)
      .catch(console.error)
  ));
});
