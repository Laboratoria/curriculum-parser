import { describe, it, expect, vi } from 'vitest';
import { resolveFixturePath } from './helpers.js';
import { parseLearningObjectives } from '../learning-objectives.js';

vi.mock('sharp');

describe('parseLearningObjectives', () => {
  it('will return an object representation', () => {
    const lo = resolveFixturePath('learning-objectives-valid');
    expect.assertions(3);
    return parseLearningObjectives(lo).then((result) => {
      expect(typeof result).toBe('object');
      expect(result.tree).toBeDefined();
      expect(result.intl).toBeDefined();
    });
    // TODO use snapshot?
  });

  it('will return an object representation regardless of errors if no --validate option', () => {
    const lo = resolveFixturePath('learning-objectives-no-title');
    expect.assertions(3);
    return parseLearningObjectives(lo).then((result) => {
      expect(typeof result).toBe('object');
      expect(result.tree).toBeDefined();
      expect(result.intl).toBeDefined();
    });
  });

  describe('with --validate option', () => {
    it('will return a valid object representation of objectives when they are valid', () => {
      const lo = resolveFixturePath('learning-objectives-valid');
      expect.assertions(3);
      return parseLearningObjectives(lo, { validate: true }).then((result) => {
        expect(typeof result).toBe('object');
        expect(result.tree).toBeDefined();
        expect(result.intl).toBeDefined();
      });
    });

    it('will throw error when objectives are missing a title', async () => {
      const lo = resolveFixturePath('learning-objectives-no-title');
      await expect(parseLearningObjectives(lo, { validate: true }))
        .rejects.toThrow('1 learning objectives without title');
    });

    it('will throw error when objectives are missing a one translation', async () => {
      const lo = resolveFixturePath('learning-objectives-missing-intl');
      await expect(parseLearningObjectives(lo, { validate: true })).rejects.toThrow();
    });
  });

  describe('with --validate --strict options', () => {
    it('will not throw error when objectives have at least one translation', async () => {
      const lo = resolveFixturePath('learning-objectives-missing-intl');
      await expect(parseLearningObjectives(lo, { validate: true, strict: true }))
        .resolves.not.toThrow();
    });
    it('will return a valid object representation of objectives when objectives have at least one translation', () => {
      const lo = resolveFixturePath('learning-objectives-missing-intl');
      expect.assertions(3);
      return parseLearningObjectives(lo, { validate: true, strict: true }).then((result) => {
        expect(typeof result).toBe('object');
        expect(result.tree).toBeDefined();
        expect(result.intl).toBeDefined();
      });
    });
    it('will throw error when objective is missing in all translations', async () => {
      const lo = resolveFixturePath('learning-objectives-missing-intl-fail-strict');
      await expect(parseLearningObjectives(lo, { validate: true, strict: true })).rejects.toThrow('missing in langs: es,pt');
    });
  });
});
