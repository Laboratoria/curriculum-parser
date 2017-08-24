'use strict';


const Path = require('path');
const Unit = require('../lib/unit');


describe('d2c', () => {

  it('should...', (done) => {
    Unit(
      Path.join(__dirname, 'fixtures'),
      { href: '00-welcome-and-orientation.md' },
      (err, json) => {
        console.log(err || json);
        done();
      }
    );
  });

});
