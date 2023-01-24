import { describe, expect, it, vi } from 'vitest';
import { resolveFixturePath } from './helpers.js';
import { parseChallenge } from '../challenge.js';

vi.mock('sharp');

describe('parseChallenge', () => {
  it('parses cjs challenge', async () => {
    const dir = resolveFixturePath('challenge-cjs');
    const parsed = await parseChallenge(dir, {}, {});
    expect(parsed.env).toBe('cjs');
    console.log(parsed.env);
  });
});
