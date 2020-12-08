const path = require('path');
const helpers = require('./helpers');
const exercise = require('../lib/exercise');


describe('exercise', () => {
  it('should reject when missing readme', () => {
    expect.assertions(1);
    return exercise(helpers.resolveFixturePath('00-part-missing-readme'))
      .catch((err) => {
        expect(err.message).toBe('Empty or missing exercise README.md');
      });
  });

  it('should parse exercise', () => (
    exercise(
      path.join(
        helpers.resolveFixturePath('paradigms'),
        '01-paradigms',
        '04-imperative-exercise',
        '01-print-primes',
      ),
    )
      .then((result) => {
        expect(result).toMatchSnapshot();
      })
  ));
});
