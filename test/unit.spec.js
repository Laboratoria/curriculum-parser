'use strict';


const Path = require('path');
const Unit = require('../lib/unit');
const Helpers = require('./helpers');


describe('Unit(path)', () => {

  it('should return a function', () => {
    expect(typeof Unit(Path.join(__dirname, 'fixtures'))).toBe('function');
  });

  describe('Unit(path)(unitDir, cb)', () => {

    it('should parse a unit dir containing a part dir with a README.md', (done) => {
      Unit(Helpers.resolveFixturePath('.'))(
        '00-unit-foo',
        (err, json) => {
          expect(err).toBe(null);
          expect(json).toMatchSnapshot();
          done();
        }
      );
    });

  });

});
