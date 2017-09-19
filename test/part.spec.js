'use strict';


const Helpers = require('./helpers');
const Part = require('../lib/part');


describe('Part', () => {

  it('should parse empty part with meta data', (done) => {
    Part(Helpers.fixturesBasePath, '')('00-part', (err, data) => {
      expect(err).toBe(null);
      expect(data).toMatchSnapshot();
      done();
    });
  });

});
