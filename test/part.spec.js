const path = require('path');
const helpers = require('./helpers');
const part = require('../lib/part');


describe('part', () => {
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
});
