const fs = require('fs');
const path = require('path');
const nock = require('nock');
const sharp = require('sharp');
const helpers = require('./helpers');
const course = require('../lib/course');


describe('course', () => {
  beforeEach(() => {
    sharp.mockClear();
    sharp().resize.mockClear();
    sharp().resize().toBuffer.mockClear();
  });

  it('should reject with error when dir doesnt exist', () => (
    course('foo')
      .catch((err) => {
        expect(err.message).toMatch(/no such file or directory/);
        expect(err.code).toBe('ENOENT');
      })
  ));

  it('should reject when README.md is empty', () => (
    course(helpers.resolveFixturePath('00-course-empty'), {
      track: 'js',
      locale: 'es-ES',
    })
      .catch((err) => {
        expect(err.message).toBe('README.md del curso está vacío');
        expect(err.path).toBe(helpers.resolveFixtureDirReadmePath('00-course-empty'));
      })
  ));

  it('should reject when README.md doesnt start with h1', () => (
    course(helpers.resolveFixturePath('01-course-no-title'), {
      track: 'js',
      locale: 'es-ES',
    })
      .catch((err) => {
        expect(err.message).toBe('README.md del curso debe empezar con un h1 con el título del curso');
        expect(err.path).toBe(helpers.resolveFixtureDirReadmePath('01-course-no-title'));
      })
  ));

  it('should have empty tags if not found', () => (
    course(helpers.resolveFixturePath('02-course-no-tags'), {
      repo: 'Laboratoria/bootcamp',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then(data => expect(data.tags).toMatchSnapshot())
  ));

  it('should read primary (default) tags', () => (
    course(helpers.resolveFixturePath('02-course-tags'), {
      repo: 'Laboratoria/bootcamp',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then(data => expect(data.tags).toMatchSnapshot())
  ));

  it('should read main and secondary tags', () => (
    course(helpers.resolveFixturePath('02-course-secondary-tags'), {
      repo: 'Laboratoria/bootcamp',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then(data => expect(data.tags).toMatchSnapshot())
  ));

  it('should parse with target audience', () => (
    course(helpers.resolveFixturePath('02-course-with-target-audience'), {
      repo: 'Laboratoria/bootcamp',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then((data) => {
        expect(data.tags).toMatchSnapshot();
        expect(data.targetAudience).toMatchSnapshot();
      })
  ));

  it('should parse grades (evaluación) section', () => (
    course(helpers.resolveFixturePath('03-course-with-grades'), {
      repo: 'Laboratoria/bootcamp',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then(data => expect(data.grades).toMatchSnapshot())
  ));

  it('should trim <hr> from html fragments', () => (
    course(helpers.resolveFixturePath('03-course-with-grades'), {
      repo: 'Laboratoria/bootcamp',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then(data => expect(data.product).toMatchSnapshot())
  ));

  it('should validate units and parts', () => (
    course(helpers.resolveFixturePath('course-with-invalid-unit'), {
      repo: 'Laboratoria/bootcamp',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .catch((err) => {
        expect(err.name).toBe('ValidationError');
        expect(err.message)
          .toBe('TopicUnitPart validation failed: type: Path `type` is required.');
      })
  ));

  it('should ignore tables in course description (taken from course readme)', () => (
    course(helpers.resolveFixturePath('00-course-with-part-tables'), {
      repo: 'Laboratoria/bootcamp',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    })
      .then(result => expect(result.syllabus).toMatchSnapshot())
  ));

  it('should have null cover and thumb if course has no images on README or no thumb.png file', async () => {
    const data = await course(helpers.resolveFixturePath('02-course-no-tags'), {
      repo: 'Laboratoria/bootcamp',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    });
    expect(data.cover).toBeNull();
    expect(data.thumb).toBeNull();
  });

  it('should create a thumbnail when file not present and has cover', async () => {
    const p = helpers.resolveFixturePath('04-course-with-image-in-readme');
    const thumbPath = path.join(p, 'thumb.png');

    if (fs.existsSync(thumbPath)) {
      fs.unlinkSync(thumbPath);
    }

    const scope = nock('https://www.101computing.net')
      .get('/wp/wp-content/uploads/Luhn-Algorithm.png')
      .reply(200, 'xxxx');

    const data = await course(p, {
      repo: 'Laboratoria/bootcamp',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    });

    expect(fs.existsSync(thumbPath)).toBe(true);
    expect(typeof data.thumb).toBe('string');
    expect(data.thumb).toMatch(/^data:image\/png;base64,/);
    fs.unlinkSync(thumbPath);
    scope.done();
    expect(sharp).toHaveBeenCalled();
    expect(sharp().resize).toHaveBeenCalledWith(395);
    expect(sharp().resize().toBuffer).toHaveBeenCalled();
    expect(data.cover)
      .toBe('https://www.101computing.net/wp/wp-content/uploads/Luhn-Algorithm.png');
    expect(data.thumb).toBe('data:image/png;base64,data:image/png;base64,xxxx');
  });

  it('should use thumb.png file if present on dir', async () => {
    const data = await course(helpers.resolveFixturePath('04-course-with-thumb.png-file'), {
      repo: 'Laboratoria/bootcamp',
      version: '2.0.0',
      track: 'js',
      locale: 'es-ES',
    });

    expect(data.thumb).not.toBeNull();
    expect(typeof data.thumb).toBe('string');
    expect(data.thumb).toMatch(/^data:image\/png;base64,/);
    expect(data.cover).toBeNull();
  });
});
