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

  it.only('...', async () => {
    const dir = resolveFixturePath('challenge-form');
    const parsed = await parseChallenge(dir, {}, {});
    // expect(parsed.env).toBe('cjs');
    console.log(parsed.intl.es.questions);
  });
});
