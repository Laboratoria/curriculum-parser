import { describe, it, expect, vi } from 'vitest';
import { resolveFixturePath } from './helpers.js';
import { parseDirname,
  splitMetaAndContent,
  getMetaFromFile,
  getTitle } from '../common.js';

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

describe('splitMetaAndContent', () => {
  it('should reject when metadata is malformed', () => {
    const badMetaData = `---
    type: read
    duration: 1h
    --`;
    expect(() => splitMetaAndContent(badMetaData))
      .toThrow('Meta section must be closed with a "---"');
  });
});

describe('getMetaFromFile', () => {
  it('should reject when project.yml is malformed', () => {
    const dir = resolveFixturePath('01-a-project-with-malformed-yml');
    expect(() => getMetaFromFile('project', dir)).rejects.toThrow(Error, /YAMLException/);
  });
});

describe('getTitle', () => {
  it('should reject when README.md doesnt start with h1 containing text', () => {
    const headingRootNodeWithLinkInsteadOfText = {
      type: 'heading',
      depth: 1,
      children: [
        {
          type: 'link',
          title: null,
          url: 'https://curriculum.laboratoria.la/es/',
          children: [Array],
          position: [Object],
        },
      ],
      position: {
        start: { line: 1, column: 1, offset: 0 },
        end: { line: 1, column: 34, offset: 33 },
      },
    };
    expect(() => getTitle(headingRootNodeWithLinkInsteadOfText)).toThrow('Expected h1 title to contain only a text node');
  });
});
