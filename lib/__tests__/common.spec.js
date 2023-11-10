import { describe, it, expect, vi } from 'vitest';
import { resolveFixturePath } from './helpers.js';
import {
  getMetaFromFile,
  getTitle,
  parseDirname,
  splitMetaAndContent,
  validateTracks,
} from '../common.js';

vi.mock('sharp');

describe('parseDirname', () => {
  it('throws when dirname has invalid chars', () => {
    expect(() => parseDirname('foo ()'))
      .toThrow('Directory name must only contain alphanumeric characters and hyphens (-)');
  });

  it('throws when dirname is not all lowercase', () => {
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

describe('validateTracks', () => {
  it('should reject if tracks is not an array', () => {
    [null, undefined, 420, 'foo', {}].forEach((variable) => {
      expect(() => validateTracks(variable))
        .toThrow('No tracks found. Expected at least one.');
    });
  });

  it('should reject if tracks array is empty', () => {
    const emptyTracks = [];
    expect(() => validateTracks(emptyTracks))
      .toThrow('No tracks found. Expected at least one.');
  });

  it('should reject if tracks contains unknown track', () => {
    const badTracks = ['web-dev', 'ux', 'data', 'foo'];
    expect(() => validateTracks(badTracks))
      .toThrow('Found unknown track "foo". Expected "web-dev", "ux" or "data".');
  });
});

describe('getMetaFromFile', () => {
  it('should reject when project.yml is malformed', () => {
    const dir = resolveFixturePath('01-a-project-with-malformed-yml');
    expect(() => getMetaFromFile('project', dir)).rejects.toThrow(Error, /YAMLException/);
  });
});

describe('getTitle', () => {
  it('throws when rootNode doesnt have any children', () => {
    expect(() => getTitle({}))
      .toThrow('Expected a node with children');
  });

  it('throws when rootNode.children is an empty array', () => {
    expect(() => getTitle({ children: [] }))
      .toThrow('Expected a node with children');
  });

  it('throws when rootNode.children[0] is falsy', () => {
    expect(() => getTitle({ children: [undefined] }))
      .toThrow('Expected README.md to start with h1 and instead saw undefined');
  });

  it('throws when rootNode.children[0] is not an h1', () => {
    expect(() => getTitle({ children: [{}] }))
      .toThrow('Expected README.md to start with h1 and instead saw undefined');
  });

  it('throws when rootNode.children[0] is an empty h1', () => {
    expect(() => getTitle({
      children: [{
        type: 'heading',
        depth: 1,
        children: [],
      }],
    }))
      .toThrow('Expected h1 title to contain only a text node');
  });

  it('throws when h1 contains something other than a text node', () => {
    expect(() => getTitle({
      children: [{
        type: 'heading',
        depth: 1,
        children: [
          {
            type: 'link',
            title: null,
            url: 'https://curriculum.laboratoria.la/es/',
            children: [],
            position: [],
          },
        ],
      }],
    }))
      .toThrow('Expected h1 title to contain only a text node');
  });
});
