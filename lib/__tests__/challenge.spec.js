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
    expect(parsed.intl.es.questions).toEqual([
      {
        title: 'What is the meaning of the universe?',
        body: '<p>Texto complementarion de la pregunta.</p>',
        solution: '42',
      },
      {
        title: 'A question with multiple choices',
        body: '',
        options: ['<p>A</p>', '<p>B</p>', '<p>C</p>'],
        solution: 1,
      },
      {
        title: 'Cuáles de las siguientes crees que son correctas?',
        body: '',
        options: ['<p>aaa</p>', '<p>bbb</p>', '<p>ccc</p>'],
        solution: [0, 1],
      },
      {
        title: 'Anything else to say?',
        body: '<p>¿Alguna cosa más que agregar?</p>',
      },
    ]);
  });
});
