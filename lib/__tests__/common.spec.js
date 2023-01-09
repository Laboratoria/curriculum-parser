import { describe, it, expect, vi } from 'vitest';
import { parseDirname } from '../common.js';

vi.mock('sharp');

describe('parseDirname', () => {
  it('allows dirname without prefix', () => {
    expect(() => parseDirname('foo ()'))
      .toThrow('Directory name must only contain alphanumeric characters and hyphens (-)');
  });

  it('allows dirname without prefix', () => {
    expect(() => parseDirname('Foo'))
      .toThrow('Directory name must be all lowercase and received Foo');
  });

  it('returns prefix and slug', () => {
    expect(parseDirname('01-foo')).toEqual({ prefix: '01', slug: 'foo' });
  });

  it('allows dirname without prefix', () => {
    expect(parseDirname('foo')).toEqual({ prefix: undefined, slug: 'foo' });
  });
});
