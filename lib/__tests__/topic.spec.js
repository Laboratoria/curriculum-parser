import { readFile } from 'node:fs/promises';
import { describe, it, expect, vi } from 'vitest';
import { resolveFixturePath, resolveFixtureDirReadmePath } from './helpers.js';
import { parseTopic } from '../topic';

vi.mock('sharp');

const pkg = JSON.parse(await readFile('package.json'));

describe('parseTopic', () => {
  describe('rejects', () => {
    it('when dir not lowercase', () => {
      const p = resolveFixturePath('a-TOPIC');
      expect.assertions(1);
      return parseTopic(p).catch((err) => {
        expect(err.message)
          .toBe('Directory name must be all lowercase and received a-TOPIC');
      });
    });

    it('when dir contains invalid chars', () => {
      const p = resolveFixturePath('a%-topic');
      expect.assertions(1);
      return parseTopic(p).catch((err) => {
        expect(err.message)
          .toBe('Directory name must only contain alphanumeric characters and hyphens (-)');
      });
    });

    it('when dir doesnt exist', () => {
      expect.assertions(2);
      return parseTopic('foo').catch((err) => {
        expect(err.message).toMatch(/no such file or directory/);
        expect(err.code).toBe('ENOENT');
      });
    });

    it('when language not supported', () => {
      const p = resolveFixturePath('01-project-bad-lang');
      expect.assertions(1);
      return parseTopic(p, {
        repo: 'Laboratoria/bootcamp',
        version: '1.0.0',
      })
        .catch((err) => {
          expect(err.message).toBe('Unsupported lang: it');
        });
    });

    it('when README.md is empty', () => {
      const p = resolveFixturePath('topic-empty');
      expect.assertions(1);
      return parseTopic(p, {
        repo: 'Laboratoria/bootcamp',
        version: '1.0.0',
      })
        .catch((err) => {
          expect(err.message).toBe(`${resolveFixtureDirReadmePath('topic-empty')} is empty`);
        });
    });

    it('when README.md doesnt contain track', () => {
      const p = resolveFixturePath('topic-without-track');
      expect.assertions(1);
      return parseTopic(p, {
        repo: 'Laboratoria/bootcamp',
        version: '1.0.0',
      })
        .catch((err) => {
          expect(err.message).toBe('Invalid track "undefined". Expected "web-dev", "ux" or "data".');
        });
    });

    it('when README.md doesnt contain tracks', () => {
      const p = resolveFixturePath('topic-without-tracks');
      expect.assertions(1);
      return parseTopic(p, {
        repo: 'Laboratoria/curriculum',
        version: '1.0.0',
      })
        .catch((err) => {
          expect(err.message).toBe('No tracks found, expected at least one.');
        });
    });

    it('when README.md doesnt start with a title', () => {
      const p = resolveFixturePath('topic-without-title');
      expect.assertions(1);
      return parseTopic(p, {
        repo: 'Laboratoria/bootcamp',
        version: '1.0.0',
      })
        .catch((err) => {
          expect(err.message).toBe('Expected README.md to start with h1 and instead saw paragraph');
        });
    });

    it('when README.md doesnt contain Syllabus header', () => {
      const p = resolveFixturePath('topic-without-syllabus');
      expect.assertions(1);
      return parseTopic(p, {
        repo: 'Laboratoria/bootcamp',
        version: '1.0.0',
      })
        .catch((err) => {
          expect(err.message).toBe('Main topic README must contain Syllabus heading');
        });
    });

    it('when duplicate unit slugs', () => {
      const p = resolveFixturePath('topic-duplicate-unit-slugs');
      return expect(parseTopic(p, {}, {})).rejects.toThrow('Duplicate unit slugs found');
    });

    it('when part fails to parse', () => {
      const p = resolveFixturePath('topic-with-bad-part');
      return expect(parseTopic(p, {}, {})).rejects.toThrow('Failed parsing units');
    });

    it('when duplicate part slugs', () => {
      const p = resolveFixturePath('topic-duplicate-part-slugs');
      expect.assertions(5);
      return parseTopic(p, {}, {}).catch((err) => {
        expect(err.message).toBe('Failed parsing units');
        expect(err.errors.length).toBe(1);
        expect(err.errors[0].message).toBe('Duplicate part slugs found');
        expect(err.errors[0].errors.length).toBe(1);
        expect(err.errors[0].errors[0].message).toBe('Duplicate part slug: figma');
      });
    });
  });

  it('adds the specified language keys to intl', () => {
    const p = resolveFixturePath('topic-with-translations');
    expect.assertions(3);
    return parseTopic(p, {}, pkg)
      .then((topic) => {
        expect(Object.keys(topic.intl).length).toBe(2);
        expect(topic.intl).toHaveProperty('es');
        expect(topic.intl).toHaveProperty('pt');
      });
  });
});
