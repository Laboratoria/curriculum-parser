'use strict';


const Path = require('path');
const SyllabusItem = require('../lib/syllabus-item');


describe('d2c', () => {

  it('should...', (done) => {
    SyllabusItem(
      Path.join(__dirname, 'fixtures'),
      { href: '00-welcome-and-orientation.md' },
      (err, json) => {
        console.log(err || json);
        done();
      }
    );
  });

});
