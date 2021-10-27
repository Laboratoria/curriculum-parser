const syllabus = require('../lib/syllabus');
const helpers = require('./helpers');


describe('syllabus', () => {
  it('should be a function', () => {
    expect(typeof syllabus).toBe('function');
  });

  it('should parse syllabus from subdirectories', () => (
    syllabus(helpers.resolveFixturePath('paradigms'))
      .then((result) => {
        expect(result).toMatchSnapshot();
      })
  ));
});
