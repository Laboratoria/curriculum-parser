import { describe, it, expect, vi } from 'vitest';
import { resolveFixturePath } from './helpers.js';
import { parsePart } from '../part.js';

vi.mock('sharp');

describe('parsePart', () => {
  describe('rejects', () => {
    it('when unknown part type', () => {
      const dir = resolveFixturePath('00-part-invalid-type');
      return expect(parsePart(dir)).rejects.toThrow('Unknown part type "foo"');
    });

    it('when invalid duration', () => {
      const dir = resolveFixturePath('00-part-invalid-duration');
      return expect(parsePart(dir)).rejects.toThrow('Failed parsing duration "omg"');
    });

    it('when no langs (translations) detected', () => {
      const dir = resolveFixturePath('00-part-missing-readme');
      return expect(parsePart(dir)).rejects.toThrow('No langs detected');
    });

    it('when challenge fails parsing', () => {
      const dir = resolveFixturePath('00-part-with-bad-challenge');
      return expect(parsePart(dir)).rejects.toThrow('Failed parsing challenges');
    });
  });

  it('parses part with duration in minutes', async () => {
    const dir = resolveFixturePath('00-part-duration-in-min');
    const parsed = await parsePart(dir);
    expect(parsed.duration).toBe(30);
  });

  it('parses part with duration in hours', async () => {
    const dir = resolveFixturePath('00-part-duration-in-hours');
    const parsed = await parsePart(dir);
    expect(parsed.duration).toBe(30);
  });

  it('parses part with challenges', async () => {
    const dir = resolveFixturePath('00-part-with-challenges');
    const parsed = await parsePart(dir);
    expect(parsed.challenges.length).toBe(2);
  });
});
