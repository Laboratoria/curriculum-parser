import { describe, expect, it, vi } from 'vitest';
import { resolveFixturePath } from './helpers.js';
import { parseChallenge } from '../challenge.js';

vi.mock('sharp');

describe('parseChallenge', () => {
  it('throws when unknown env', () => {
    const dir = resolveFixturePath('challenge-unknown-env');
    return expect(parseChallenge(dir, {}, {}))
      .rejects.toThrow('Unknown challenge env "foo"');
  });

  it('parses cjs challenge', async () => {
    const dir = resolveFixturePath('challenge-cjs');
    const parsed = await parseChallenge(dir, {}, {});
    expect(parsed.env).toBe('cjs');
  });

  it('parses form challenge', async () => {
    const dir = resolveFixturePath('challenge-form');
    const parsed = await parseChallenge(dir, {}, {});
    expect(parsed.env).toBe('form');
    expect(parsed.track).toBe('data');
    expect(parsed.intl.es.questions).toMatchSnapshot();
    expect(parsed.intl.es.questions[0].solution.multiline).toBeFalsy();
  });

  it('parses form challenge with multiline question', async () => {
    const dir = resolveFixturePath('challenge-form-with-multiline-question');
    const parsed = await parseChallenge(dir, {}, {});
    expect(parsed.env).toBe('form');
    expect(parsed.intl.es.questions).toMatchSnapshot();
    expect(parsed.intl.es.questions[0].solution.multiline).toBe(true);
  });
});
