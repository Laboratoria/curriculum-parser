const { marked } = require('marked');
const { JSDOM } = require('jsdom');
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
      ['abc', null],
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

    it('should trim preceding <hr>', () => {
      const tokens = marked.lexer('***\nBlah blah Blah\n\nFoo bar baz');
      expect(common.tokensToHTML(tokens, tokens.links)).toMatchSnapshot();
    });

    it('should trim multiple preceding <hr>', () => {
      const tokens = marked.lexer('***\n***\nBlah blah Blah\n\nFoo bar baz');
      expect(common.tokensToHTML(tokens, tokens.links)).toMatchSnapshot();
    });

    it('should trim multiple dangling <hr>', () => {
      const tokens = marked.lexer('Blah blah Blah\n\nFoo bar baz\n***\n***\n');
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
      expect(common.parseReadme('# foo')).toEqual({ title: 'foo' });
    });

    it('should ignore unknown meta data keys', () => {
      const data = helpers.readFixtureFile('README-unknown-meta.md');
      expect(common.parseReadme(data, {
        tipo: 'type',
        formato: 'format',
        duración: 'duration',
      })).toMatchSnapshot();
    });

    it('should parse ok when all meta data is present', () => {
      const data = helpers.readFixtureFile('README-body-starts-with-h3.md');
      expect(common.parseReadme(data, {
        tipo: 'type',
        formato: 'format',
        duración: 'duration',
      })).toMatchSnapshot();
    });

    it('should warn when missing meta data', () => {
      const data = helpers.readFixtureFile('README-missing-meta-key.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        formato: 'format',
        duración: 'duration',
      });
      expect(parsed).toMatchSnapshot();
    });

    it('should parse youtube short url as embed', () => {
      const data = helpers.readFixtureFile('README-with-youtube-short-link.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        formato: 'format',
        duración: 'duration',
      });
      const { window } = new JSDOM(parsed.body);
      const { document } = window;
      const iframeContainer = document.querySelector('.iframe-container');
      expect(iframeContainer instanceof window.HTMLDivElement).toBe(true);
      expect(iframeContainer.children.length).toBe(1);
      expect(iframeContainer.children[0] instanceof window.HTMLIFrameElement).toBe(true);
      // expect(iframeContainer.children[0].id).toBe('ytplayer');
      expect(iframeContainer.children[0].width).toBe('640');
      expect(iframeContainer.children[0].height).toBe('360');
      expect(iframeContainer.children[0].frameBorder).toBe('0');
      expect(iframeContainer.children[0].src).toBe('https://www.youtube.com/embed/ge4h5uJN6KI?autoplay=0');
    });

    it('should pass through query string params when embedding youtube videos (long url)', () => {
      const data = helpers.readFixtureFile('README-with-youtube-with-params.md');
      const parsed = common.parseReadme(data, {});
      const { window } = new JSDOM(parsed.body);
      const { document } = window;
      const iframeContainer = document.querySelector('.iframe-container');
      expect(iframeContainer instanceof window.HTMLDivElement).toBe(true);
      expect(iframeContainer.children.length).toBe(1);
      expect(iframeContainer.children[0] instanceof window.HTMLIFrameElement).toBe(true);
      // expect(iframeContainer.children[0].id).toBe('ytplayer');
      expect(iframeContainer.children[0].width).toBe('640');
      expect(iframeContainer.children[0].height).toBe('360');
      expect(iframeContainer.children[0].frameBorder).toBe('0');
      expect(iframeContainer.children[0].src).toBe('https://www.youtube.com/embed/ft5TzxG-LAc?cc_lang_pref=es&cc_load_policy=1&autoplay=0');
    });

    it('should pass through query string params when embedding youtube videos (short url)', () => {
      const data = helpers.readFixtureFile('README-with-youtube-short-link-with-params.md');
      const parsed = common.parseReadme(data, {});
      const { window } = new JSDOM(parsed.body);
      const { document } = window;
      const iframeContainer = document.querySelector('.iframe-container');
      expect(iframeContainer instanceof window.HTMLDivElement).toBe(true);
      expect(iframeContainer.children.length).toBe(1);
      expect(iframeContainer.children[0] instanceof window.HTMLIFrameElement).toBe(true);
      // expect(iframeContainer.children[0].id).toBe('ytplayer');
      expect(iframeContainer.children[0].width).toBe('640');
      expect(iframeContainer.children[0].height).toBe('360');
      expect(iframeContainer.children[0].frameBorder).toBe('0');
      expect(iframeContainer.children[0].src).toBe('https://www.youtube.com/embed/ge4h5uJN6KI?cc_lang_pref=es&cc_load_policy=1&autoplay=0');
    });

    it('should parse vimeo url as embed', () => {
      const data = helpers.readFixtureFile('README-with-vimeo-link.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        formato: 'format',
        duración: 'duration',
      });
      const { window } = new JSDOM(parsed.body);
      const { document } = window;
      const iframeContainer = document.querySelector('.iframe-container');
      expect(iframeContainer instanceof window.HTMLDivElement).toBe(true);
      expect(iframeContainer.children.length).toBe(1);
      expect(iframeContainer.children[0] instanceof window.HTMLIFrameElement).toBe(true);
      expect(iframeContainer.children[0].width).toBe('640');
      expect(iframeContainer.children[0].height).toBe('360');
      expect(iframeContainer.children[0].frameBorder).toBe('0');
      expect(iframeContainer.children[0].src).toBe(
        'https://player.vimeo.com/video/94950270?title=0&byline=0&portrait=0',
      );
      expect(iframeContainer.children[0].scrolling).toBe('no');
    });

    it('should parse vimeo url with hash as embed', () => {
      const data = helpers.readFixtureFile('README-with-vimeo-link-with-hash.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        formato: 'format',
        duración: 'duration',
      });
      const { window } = new JSDOM(parsed.body);
      const { document } = window;
      const iframeContainer = document.querySelector('.iframe-container');
      expect(iframeContainer instanceof window.HTMLDivElement).toBe(true);
      expect(iframeContainer.children.length).toBe(1);
      expect(iframeContainer.children[0] instanceof window.HTMLIFrameElement).toBe(true);
      expect(iframeContainer.children[0].width).toBe('640');
      expect(iframeContainer.children[0].height).toBe('360');
      expect(iframeContainer.children[0].frameBorder).toBe('0');
      expect(iframeContainer.children[0].src).toBe(
        'https://player.vimeo.com/video/94950270?title=1&byline=0&portrait=0&h=e9afa939c2',
      );
      expect(iframeContainer.children[0].scrolling).toBe('no');
    });

    it('should parse loom url as embed', () => {
      const data = helpers.readFixtureFile('README-with-loom-link.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        formato: 'format',
        duración: 'duration',
      });
      const { window } = new JSDOM(parsed.body);
      const { document } = window;
      const iframeContainer = document.querySelector('.iframe-container');
      expect(iframeContainer instanceof window.HTMLDivElement).toBe(true);
      expect(iframeContainer.children.length).toBe(1);
      expect(iframeContainer.children[0] instanceof window.HTMLIFrameElement).toBe(true);
      expect(iframeContainer.children[0].width).toBe('640');
      expect(iframeContainer.children[0].height).toBe('360');
      expect(iframeContainer.children[0].frameBorder).toBe('0');
      expect(iframeContainer.children[0].src).toBe('https://www.useloom.com/embed/90102cf63263435faa7f867c1e9c2d33');
    });

    it('should parse typeform url as embed', () => {
      const data = helpers.readFixtureFile('README-with-typeform-link.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        formato: 'format',
        duración: 'duration',
      });
      const { window } = new JSDOM(parsed.body);
      const { document } = window;
      const iframe = document.querySelector('iframe');
      expect(iframe instanceof window.HTMLIFrameElement).toBe(true);
      expect(iframe.frameBorder).toBe('0');
      expect(iframe.width).toBe('100%');
      expect(iframe.height).toBe('100%');
      expect(iframe.style.height).toBe('100vh');
      expect(iframe.src).toBe('https://laboratoria.typeform.com/to/J8fzhH');
    });

    it('should parse soundcloud url as embed', () => {
      const data = helpers.readFixtureFile('README-with-soundcloud-podcast.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        formato: 'format',
        duración: 'duration',
      });
      const { window } = new JSDOM(parsed.body);
      const { document } = window;
      const iframeContainer = document.querySelector('.iframe-container');
      expect(iframeContainer instanceof window.HTMLDivElement).toBe(true);
      expect(iframeContainer.children.length).toBe(1);
      expect(iframeContainer.children[0] instanceof window.HTMLIFrameElement).toBe(true);
      expect(iframeContainer.children[0].width).toBe('640');
      expect(iframeContainer.children[0].height).toBe('180');
      expect(iframeContainer.children[0].frameBorder).toBe('0');
      expect(iframeContainer.children[0].src).toBe('https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/332779915');
      expect(iframeContainer.children[0].scrolling).toBe('no');
    });

    it('should parse slide url as embed', () => {
      const data = helpers.readFixtureFile('README-with-google-slide.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        formato: 'format',
        duración: 'duration',
      });
      const { window } = new JSDOM(parsed.body);
      const { document } = window;
      const iframeContainer = document.querySelector('.iframe-container');
      expect(iframeContainer instanceof window.HTMLDivElement).toBe(true);
      expect(iframeContainer.children.length).toBe(1);
      expect(iframeContainer.children[0] instanceof window.HTMLIFrameElement).toBe(true);
      expect(iframeContainer.children[0].width).toBe('640');
      expect(iframeContainer.children[0].height).toBe('360');
      expect(iframeContainer.children[0].frameBorder).toBe('0');
      expect(iframeContainer.children[0].src).toBe('https://docs.google.com/presentation/d/e/2PACX-1vS_df7E0e1gALi_nUVpLN9D1eL2shAta_f8E7oI1N0nSv1u77EnIh9ZBAhaGOIN7saMcr6il3c7VjVv');
    });

    it('should ignore relative links', () => {
      const data = helpers.readFixtureFile('README-with-relative-link.md');
      const parsed = common.parseReadme(data, {
        tipo: 'type',
        formato: 'format',
        duración: 'duration',
      });
      const { window } = new JSDOM(parsed.body);
      const a = window.document.querySelectorAll('a')[0];
      expect(a.href).toBe('./a/b/c');
    });
  });
});
