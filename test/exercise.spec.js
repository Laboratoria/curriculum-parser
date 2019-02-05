const path = require('path');
const helpers = require('./helpers');
const exercise = require('../lib/exercise');


describe('exercise', () => {
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
