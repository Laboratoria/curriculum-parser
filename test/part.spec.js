const path = require('path');
const helpers = require('./helpers');
const part = require('../lib/part');
const { hasOwnProperty } = require('../lib/common');


describe('part', () => {
  it('should reject when part is missing readme', () => {
    expect.assertions(1);
    return part(helpers.resolveFixturePath('00-part-missing-readme'))
      .catch((err) => {
        expect(err.message).toBe('Part is missing README.md');
      });
  });

  it('should reject when bad duration', () => {
    expect.assertions(1);
    return part(helpers.resolveFixturePath('00-part-with-bad-duration'))
      .catch((err) => {
        expect(err.message).toBe('Could not parse part duration');
      });
  });

  it('should parse empty part with meta data', () => (
    part(path.join(helpers.fixturesBasePath, '00-part'))
      .then(data => expect(data).toMatchSnapshot())
  ));

  it('should parse quiz', () => (
    part(path.join(helpers.fixturesBasePath, '00-quiz'))
      .then(data => expect(data).toMatchSnapshot())
  ));

  it('should parse empty part with meta data [pt_BR]', () => (
    part(path.join(helpers.fixturesBasePath, '00-part-pt'))
      .then(data => expect(data).toMatchSnapshot())
  ));

  it('should parse part with exercises', () => (
    part(path.join(
      helpers.resolveFixturePath('paradigms'),
      '01-paradigms',
      '04-imperative-exercise',
    ))
      .then(result => expect(result).toMatchSnapshot())
  ));

  it('should not include exercises prop for practice without exercises', () => (
    part(helpers.resolveFixturePath('practice-part-without-exercises'))
      .then(result => expect(hasOwnProperty(result, 'exercises')).toBe(false))
  ));
});
