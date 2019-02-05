const marked = require('marked');
const cheerio = require('cheerio');
const helpers = require('./helpers');
const common = require('../lib/common');


describe('common', () => {
  const publicMethods = [
    'omit',
    'isDirname',
    'parseDirname',
    'parseDuration',
    'tokensToHTML',
    'parseReadme',
  ];

  it(`debería exportar ${publicMethods.join(', ')}`, () => {
    publicMethods.forEach((key) => {
      expect(typeof common[key]).toBe('function');
    });
  });

  describe('common.omit(obj, omitKeys)', () => {
    it('should create a new object with all enumerable props from obj except omitKeys', () => {
      const obj = { foo: 1, bar: 2 };
      const omitted = common.omit(obj, ['bar']);
      expect(omitted).not.toBe(obj);
      expect(omitted).toEqual({ foo: 1 });
      expect(obj).toEqual({ foo: 1, bar: 2 });
    });
  });


  describe('common.isDirname(file)', () => {
    it('should return true for 01-foo', () => {
      expect(common.isDirname('01-foo')).toBe(true);
    });

    it('should return false for empty string', () => {
      expect(common.isDirname('')).toBe(false);
    });

    it('should return false for foo', () => {
      expect(common.isDirname('foo')).toBe(false);
    });
  });


  describe('common.parseDirname(path)', () => {
    it('should throw when no path passed', () => {
      expect(() => common.parseDirname()).toThrow(/path.*must be.*string/i);
    });

    [
      ['foo', { slug: '.', order: 0 }],
      ['foo/README.md', { slug: 'foo', order: 0 }],
      ['01-foo/README.md', { slug: 'foo', order: 1 }],
    ].forEach((pair) => {
      it(`should return ${JSON.stringify(pair[1])} for ${pair[0]}`, () => {
        expect(common.parseDirname(pair[0])).toEqual(pair[1]);
      });
    });
  });


  describe('common.parseDuration(str)', () => {
    [
      ['10min', 10],
      ['10', 10],
      ['10m', 10],
      ['60min', 60],
      ['120m', 120],
      ['1h', 60],
      ['2.5h', 150],
    ].forEach((pair) => {
      it(`should return ${pair[1]} for ${pair[0]}`, () => {
        expect(common.parseDuration(pair[0])).toBe(pair[1]);
      });
    });
  });


  describe('common.tokensToHTML(tokens, links)', () => {
    it('should trim dangling <hr>', () => {
      const tokens = marked.lexer('Blah blah Blah\n\nFoo bar baz\n\n***\n');
      expect(common.tokensToHTML(tokens, tokens.links)).toMatchSnapshot();
    });
  });


  describe('common.parseReadme(data, metaKeys)', () => {
    it('should throw when no data', () => {
      expect(() => common.parseReadme()).toThrow(/README.md está vacío/);
    });

    it('should throw when it doesnt start with h1', () => {
      expect(() => common.parseReadme('foo')).toThrow(/README.md debe empezar con un h1 con el título/);
    });

    it('should parse ok when only title', () => {
      expect(common.parseReadme('# foo')).toEqual({ title: 'foo', body: '' });
    });

    it('should parse ok when all meta data is present', () => {
      const data = helpers.readFixtureFile('README-body-starts-with-h3.md');
      expect(common.parseReadme(data, {
        tipo: 'type',
        type: 'type',
        formato: 'format',
        format: 'format',
        duración: 'duration',
        duration: 'duration',
      })).toMatchSnapshot();
    });

    it('should warn when missing meta data', () => {
      const data = helpers.readFixtureFile('README-missing-meta-key.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        type: 'type',
        formato: 'format',
        format: 'format',
        duración: 'duration',
        duration: 'duration',
      });
      expect(parsed).toMatchSnapshot();
    });

    it('should parse youtube short url as embed', () => {
      const data = helpers.readFixtureFile('README-with-youtube-short-link.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        type: 'type',
        formato: 'format',
        format: 'format',
        duración: 'duration',
        duration: 'duration',
      });
      const $ = cheerio.load(parsed.body);
      const $iframeContainer = $('.iframe-container');
      expect($iframeContainer.length).toBe(1);
      const $iframe = $iframeContainer.children()[0];
      expect($iframe.type).toBe('tag');
      expect($iframe.name).toBe('iframe');
      expect($iframe.attribs).toMatchSnapshot();
    });

    it('should pass through query string params when embedding youtube videos (long url)', () => {
      const data = helpers.readFixtureFile('README-with-youtube-with-params.md');
      const parsed = common.parseReadme(data, {});
      const $ = cheerio.load(parsed.body);
      const $iframeContainer = $('.iframe-container');
      expect($iframeContainer.length).toBe(1);
      const $iframe = $iframeContainer.children()[0];
      expect($iframe.type).toBe('tag');
      expect($iframe.name).toBe('iframe');
      expect($iframe.attribs).toMatchSnapshot();
    });

    it('should pass through query string params when embedding youtube videos (short url)', () => {
      const data = helpers.readFixtureFile('README-with-youtube-short-link-with-params.md');
      const parsed = common.parseReadme(data, {});
      const $ = cheerio.load(parsed.body);
      const $iframeContainer = $('.iframe-container');
      expect($iframeContainer.length).toBe(1);
      const $iframe = $iframeContainer.children()[0];
      expect($iframe.type).toBe('tag');
      expect($iframe.name).toBe('iframe');
      expect($iframe.attribs).toMatchSnapshot();
    });

    it('should parse vimeo url as embed', () => {
      const data = helpers.readFixtureFile('README-with-vimeo-link.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        type: 'type',
        formato: 'format',
        format: 'format',
        duración: 'duration',
        duration: 'duration',
      });
      const $ = cheerio.load(parsed.body);
      const $iframeContainer = $('.iframe-container');
      expect($iframeContainer.length).toBe(1);
      const $iframe = $iframeContainer.children()[0];
      expect($iframe.type).toBe('tag');
      expect($iframe.name).toBe('iframe');
      expect($iframe.attribs).toMatchSnapshot();
    });

    it('should parse loom url as embed', () => {
      const data = helpers.readFixtureFile('README-with-loom-link.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        type: 'type',
        formato: 'format',
        format: 'format',
        duración: 'duration',
        duration: 'duration',
      });
      const $ = cheerio.load(parsed.body);
      const $iframeContainer = $('.iframe-container');
      expect($iframeContainer.length).toBe(1);
      const $iframe = $iframeContainer.children()[0];
      expect($iframe.type).toBe('tag');
      expect($iframe.name).toBe('iframe');
      expect($iframe.attribs).toMatchSnapshot();
    });

    it('should parse typeform url as embed', () => {
      const data = helpers.readFixtureFile('README-with-typeform-link.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        type: 'type',
        formato: 'format',
        format: 'format',
        duración: 'duration',
        duration: 'duration',
      });
      const $ = cheerio.load(parsed.body);
      const $iframe = $('iframe')[0];
      expect($iframe.type).toBe('tag');
      expect($iframe.name).toBe('iframe');
      expect($iframe.attribs).toMatchSnapshot();
    });

    it('should parse soundcloud url as embed', () => {
      const data = helpers.readFixtureFile('README-with-soundcloud-podcast.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        type: 'type',
        formato: 'format',
        format: 'format',
        duración: 'duration',
        duration: 'duration',
        duração: 'duration',
      });
      const $ = cheerio.load(parsed.body);
      const $iframeContainer = $('.iframe-container');
      expect($iframeContainer.length).toBe(1);
      const $iframe = $iframeContainer.children()[0];
      expect($iframe.type).toBe('tag');
      expect($iframe.name).toBe('iframe');
      expect($iframe.attribs).toMatchSnapshot();
    });

    it('should parse slide url as embed', () => {
      const data = helpers.readFixtureFile('README-with-google-slide.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        type: 'type',
        formato: 'format',
        format: 'format',
        duración: 'duration',
        duration: 'duration',
        duração: 'duration',
      });
      const $ = cheerio.load(parsed.body);
      const $iframeContainer = $('.iframe-container');
      expect($iframeContainer.length).toBe(1);
      const $iframe = $iframeContainer.children()[0];
      expect($iframe.type).toBe('tag');
      expect($iframe.name).toBe('iframe');
      expect($iframe.attribs).toMatchSnapshot();
    });
  });
});
