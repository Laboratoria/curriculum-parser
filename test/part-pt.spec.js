'use strict';


const Helpers = require('./helpers');
const Part = require('../lib/part');


describe('Part', () => {

  it('should parse empty part with meta data [pt_BR]', (done) => {
    Part(Helpers.fixturesBasePath, '')('00-part-pt', (err, data) => {
      expect(err).toBe(null);
      expect(data).toMatchSnapshot();
      done();
    });
  });

});
