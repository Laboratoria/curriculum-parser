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

  it('throws when no tracks', () => {
    const dir = resolveFixturePath('challenge-without-track-nor-tracks');
    return expect(parseChallenge(dir, {}, {}))
      .rejects.toThrow('No tracks found. Expected at least one');
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
    expect(parsed.intl.pt.questions).toMatchSnapshot();
    expect(parsed.intl.es.questions[0].solution.multiline).toBeFalsy();
    expect(parsed.intl.pt.questions[0].solution.multiline).toBeFalsy();
  });

  it('parses form challenge with multiline question', async () => {
    const dir = resolveFixturePath('challenge-form-with-multiline-question');
    const parsed = await parseChallenge(dir, {}, {});
    expect(parsed.env).toBe('form');
    expect(parsed.intl.es.questions).toMatchSnapshot();
    expect(parsed.intl.pt.questions).toMatchSnapshot();
    expect(parsed.intl.es.questions[0].solution.multiline).toBe(true);
    expect(parsed.intl.pt.questions[0].solution.multiline).toBe(true);
  });

  it('ignores questions with no heading', async () => {
    const dir = resolveFixturePath('challenge-form-question-no-heading');
    const parsed = await parseChallenge(dir, {}, {});
    expect(parsed.env).toBe('form');
    expect(parsed.intl.es.questions).toMatchSnapshot();
    expect(parsed.intl.pt.questions).toMatchSnapshot();
  });
});
