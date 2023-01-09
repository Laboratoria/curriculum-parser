import { describe, it, expect, vi } from 'vitest';
import { existsSync, unlinkSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import nock from 'nock';
import sharp from 'sharp';
import { resolveFixturePath } from './helpers.js';
import { parseProject } from '../project';

vi.mock('sharp');

const pkg = JSON.parse(await readFile('package.json'));

describe('project', () => {
  it('should reject when dir not lowercase', () => {
    const p = resolveFixturePath('a-Project');
    expect.assertions(1);
    return parseProject(p).catch((err) => {
      expect(err.message)
        .toBe('Directory name must be all lowercase and received a-Project');
    });
  });

  it('should reject when dir contains invalid chars', () => {
    const p = resolveFixturePath('a-project #');
    expect.assertions(1);
    return parseProject(p).catch((err) => {
      expect(err.message)
        .toBe('Directory name must only contain alphanumeric characters and hyphens (-)');
    });
  });

  it('should reject when language not supported', () => {
    const p = resolveFixturePath('01-project-bad-lang');
    expect.assertions(1);
    return parseProject(p, {
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
    }).catch((err) => {
      expect(err.message).toBe('Unsupported lang: it');
    });
  });

  it('should reject when dir doesnt exist', () => {
    expect.assertions(2);
    return parseProject('01-foo').catch((err) => {
      expect(err.message).toMatch(/no such file or directory/);
      expect(err.code).toBe('ENOENT');
    });
  });

  it('should reject when README.md is empty', () => {
    const p = resolveFixturePath('00-course-empty');
    expect.assertions(2);
    return parseProject(p).catch((err) => {
      expect(err.message).toBe(`${path.join(p, 'README.md')} is empty`);
      expect(err.path).toBe(path.join(p, 'README.md'));
    });
  });

  it('should reject when README.md doesnt start with h1', () => {
    const p = resolveFixturePath('01-a-project-without-a-title');
    const p2 = resolveFixturePath('01-a-project-without-a-bad-title');
    expect.assertions(4);
    return parseProject(p)
      .then(() => {
        throw new Error('This should never happen');
      })
      .catch((err) => {
        expect(err.message)
          .toBe('Expected README.md to start with h1 and instead saw heading (depth: 2)');
        expect(err.path).toBe(path.join(p, 'README.md'));

        return parseProject(p2);
      })
      .then(() => {
        throw new Error('This should never happen');
      })
      .catch((err) => {
        expect(err.message)
          .toBe('Expected README.md to start with h1 and instead saw paragraph');
        expect(err.path).toBe(path.join(p2, 'README.md'));
      });
  });

  it('should reject when unknown track', () => {
    const p = resolveFixturePath('01-a-project-without-track');
    return parseProject(p, {
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
    }, pkg)
      .catch((err) => {
        expect(err.message)
          .toBe('Invalid track "undefined". Expected "web-dev" or "ux".');
      });
  });

  it('should reject when unknown learning objective', () => {
    const p = resolveFixturePath('01-a-project-with-unknown-learning-objective');
    expect.assertions(2);
    return parseProject(p, {
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      lo: resolveFixturePath('learning-objectives'),
    }, pkg)
      .catch((err) => {
        expect(err.message).toBe('Unknown learning objectives: html/foo.');
        expect(err.path).toBe(path.join(p, 'project.yml'));
      });
  });

  it('should parse portuguese project', () => {
    const p = resolveFixturePath('01-a-project-with-pt-translation');
    return parseProject(p, {
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
    }, pkg)
      .then(({ createdAt, parserVersion, ...parsed }) => {
        expect(parserVersion).toBe(pkg.version);
        expect(parsed.slug).toBe('a-project-with-pt-translation');
        expect(Object.keys(parsed.intl)).toEqual(['pt']);
        expect(parsed).toMatchSnapshot();
      });
  });

  it('should parse a project with learning objectives without validating against known list', () => {
    const p = resolveFixturePath('01-a-project-with-learning-objectives');
    return parseProject(p, {
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
    }, pkg)
      .then(({ parserVersion, createdAt, ...parsed }) => {
        expect(parserVersion).toBe(pkg.version);
        expect(parsed).toMatchSnapshot();
      });
  });

  it('should parse a project with learning objectives validating against known list', () => {
    const p = resolveFixturePath('01-a-project-with-learning-objectives');
    return parseProject(p, {
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      lo: path.join(__dirname, '__fixtures__', 'learning-objectives'),
    }, pkg)
      .then(({ parserVersion, createdAt, ...parsed }) => {
        expect(parserVersion).toBe(pkg.version);
        expect(parsed).toMatchSnapshot();
      });
  });

  it('should expand learning objectives children when only parent is mentioned', () => {
    const p = resolveFixturePath('01-a-project-with-lo-needing-expansion');
    return parseProject(p, {
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      lo: path.join(__dirname, '__fixtures__', 'learning-objectives'),
    }, pkg)
      .then((result) => {
        expect(result.learningObjectives).toMatchSnapshot();
      });
  });

  it('should extract first paragraph of _resumen del proyecto_ as summary', () => {
    const p = resolveFixturePath('01-a-project-with-summary');
    return parseProject(p, {
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      lo: path.join(__dirname, '__fixtures__', 'learning-objectives'),
    }, pkg)
      .then((result) => {
        expect(result.intl['es'].summary).toMatchSnapshot();
        expect(result.intl['pt'].summary).toMatchSnapshot();
      });
  });

  it('should create a thumbnail when file not present and has cover', () => {
    const p = resolveFixturePath('01-a-project-without-thumb');
    const thumbPath = path.join(p, 'thumb.png');

    if (existsSync(thumbPath)) {
      unlinkSync(thumbPath);
    }

    const scope = nock('https://www.101computing.net')
      .get('/wp/wp-content/uploads/Luhn-Algorithm.png')
      .reply(200, 'xxxx');

    return parseProject(p, {
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      lo: path.join(__dirname, '__fixtures__', 'learning-objectives'),
    }, pkg)
      .then((result) => {
        expect(existsSync(thumbPath)).toBe(true);
        expect(typeof result.thumb).toBe('string');
        expect(result.thumb).toMatch(/^data:image\/png;base64,/);
        unlinkSync(thumbPath);
        scope.done();
        expect(sharp).toHaveBeenCalled();
        expect(sharp().resize).toHaveBeenCalledWith(395);
        expect(sharp().resize().toBuffer).toHaveBeenCalled();
      });
  });

  it('should try to create a thumbnail and fail when HTTP status not 200', () => {
    const p = resolveFixturePath('01-a-project-without-thumb-again');
    const thumbPath = path.join(p, 'thumb.png');

    expect.assertions(2);
    expect(existsSync(thumbPath)).toBe(false);

    nock('https://www.101computing.net')
      .get('/wp/wp-content/uploads/Luhn-Algorithm.png')
      .reply(404, '');

    return expect(parseProject(p, {
      repo: 'Laboratoria/bootcamp',
      version: '1.0.0',
      lo: path.join(__dirname, '__fixtures__', 'learning-objectives'),
    })).rejects.toThrow('HTTP error 404');
  });
});
