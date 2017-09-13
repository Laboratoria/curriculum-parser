'use strict';


const Helpers = require('./helpers');
const Common = require('../lib/common');


describe('Common', () => {

  const publicMethods = [
    'omit',
    'isDirname',
    'parseDirname',
    'parseDuration',
    'tokensToHTML',
    'parseReadme',
  ];

  it(`debería exportar ${publicMethods.join(', ')}`, () => {
    publicMethods.forEach(key => {
      expect(typeof Common[key]).toBe('function');
    })
  });


  describe('Common.omit(obj, omitKeys)', () => {

    it('should create a new object with all enumerable props from obj except omitKeys', () => {
      const obj = { foo: 1, bar: 2 };
      const omitted = Common.omit(obj, ['bar']);
      expect(omitted).not.toBe(obj);
      expect(omitted).toEqual({ foo: 1 });
      expect(obj).toEqual({ foo: 1, bar: 2 });
    });

  });


  describe('Common.isDirname(file)', () => {

    it('should return true for 01-foo', () => {
      expect(Common.isDirname('01-foo')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(Common.isDirname('')).toBe(false);
    });

    it('should return false for foo', () => {
      expect(Common.isDirname('foo')).toBe(false);
    });

  });


  describe('Common.parseDirname(path)', () => {

    it('should throw when no path passed', () => {
      expect(() => Common.parseDirname()).toThrow(/Path must be a string/);
    });

    [
      ['foo', { slug: '.', order: 0 }],
      ['foo/README.md', { slug: 'foo', order: 0 }],
      ['01-foo/README.md', { slug: 'foo', order: 1 }]
    ].forEach(pair => {
      it(`should return ${JSON.stringify(pair[1])} for ${pair[0]}`, () => {
        expect(Common.parseDirname(pair[0])).toEqual(pair[1]);
      });
    })

  });


  describe('Common.parseDuration(str)', () => {

    it.skip('should...', () => {
      console.log(Common.parseDuration);
    });

  });


  describe('Common.tokensToHTML(tokens, links)', () => {

    it.skip('should...', () => {
      console.log(Common.tokensToHTML);
    });

  });


  describe('Common.parseReadme(data, metaKeys)', () => {

    it('should throw when no data', () => {
      expect(() => Common.parseReadme()).toThrow(/README.md está vacío/);
    });

    it('should throw when it doesnt start with h1', () => {
      expect(() => Common.parseReadme('foo')).toThrow(/README.md debe empezar con un h1 con el título/);
    });

    it('should parse ok when only title', () => {
      expect(Common.parseReadme('# foo')).toEqual({ title: 'foo', body: '' });
    });

    it('should parse ok when all meta data is present', () => {
      const data = Helpers.readFixtureFile('README-body-starts-with-h3.md');
      expect(Common.parseReadme(data, {
        tipo: 'type',
        type: 'type',
        formato: 'format',
        format: 'format',
        duración: 'duration',
        duration: 'duration',
      })).toMatchSnapshot();
    });

    it('should warn when missing meta data', () => {
      const data = Helpers.readFixtureFile('README-missing-meta-key.md');
      const parsed = Common.parseReadme(data, {
        tipo: 'type',
        type: 'type',
        formato: 'format',
        format: 'format',
        duración: 'duration',
        duration: 'duration',
      });
      expect(parsed).toMatchSnapshot();
    });

  });

});
