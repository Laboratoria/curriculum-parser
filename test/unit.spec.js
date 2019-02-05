const path = require('path');
const unit = require('../lib/unit');
const helpers = require('./helpers');


describe('unit', () => {
  it('should be a function', () => expect(typeof unit).toBe('function'));

  it('should parse a unit dir containing a part dir with a README.md', () => (
    unit(path.join(
      helpers.resolveFixturePath('.'),
      'paradigms',
      '01-paradigms',
    ))
      .then(result => expect(result).toMatchSnapshot())
  ));
});
