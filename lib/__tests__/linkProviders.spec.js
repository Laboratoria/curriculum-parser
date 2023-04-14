import { describe, it, expect, vi } from 'vitest';
import { parseLinks } from '../linkProviders.js';

vi.mock('sharp');


describe.only('parseLinks', () => {
  describe('Youtube', () => {
    it('returns expected iframe node for link with format youtu.be', () => {
      const linkNode = JSON.parse(`{"type":"link",
        "title":null,
        "url":"https://youtu.be/ge4h5uJN6KI",
        "children":[{"type":"image","title":null,"url":"https://lh5.googleusercontent.com/Nw1xRXhRhwllHgKL4m6xCFmPCubo7wgZ0bi7NSnRQk-FJm5AWPeJKbrF9yY3Uv8XJGbYcJhL6xDwBDkxYrf3fRjnp8__diJ8pJbnuTpD-KDTo4jXmu9QHkmjogOsOLfDpFN6AeIU9Hg","alt":"El equipo de desarrollo","position":{"start":{"line":22,"column":2,"offset":469},"end":{"line":22,"column":203,"offset":670}}}],
        "position":{"start":{"line":22,"column":1,"offset":468},"end":{"line":22,"column":234,"offset":701}}
      }`);
      const iframeHTML = '<iframe width="640" height="360" src="https://www.youtube.com/embed/ge4h5uJN6KI?autoplay=0" frameBorder="0" gesture="media" allow="encrypted-media" allowfullscreen="true"></iframe>';
      const parsedNode = parseLinks(linkNode);
      expect(parsedNode.type).toEqual('html');
      expect(parsedNode.value).toEqual(iframeHTML);
    });

    it('returns expected iframe node for link with format youtube.com/watch?v', () => {
      const linkNode = JSON.parse(`{"type":"link",
        "title":null,
        "url":"https://www.youtube.com/watch?v=BPlCatqZRPI",
        "children":[{"type":"text","value":"Video : Youtube","position":{"start":{"line":28,"column":4,"offset":1039},"end":{"line":28,"column":19,"offset":1054}}}],
        "position":{
          "start":{"line":28,"column":3,"offset":1038},
          "end":{"line":28,"column":65,"offset":1100}
        }
      }`);
      const iframeHTML = '<iframe width="640" height="360" src="https://www.youtube.com/embed/BPlCatqZRPI?autoplay=0" frameBorder="0" gesture="media" allow="encrypted-media" allowfullscreen="true"></iframe>';
      const parsedNode = parseLinks(linkNode);
      expect(parsedNode.type).toEqual('html');
      expect(parsedNode.value).toEqual(iframeHTML);
    });

    // it.skip('returns expected iframe node for link with params preserved', () => {
    //   const linkNode = JSON.parse();
    //   const iframeValue = '<iframe width="640" height="360" src="https://www.youtube.com/embed/BPlCatqZRPI?autoplay=0" frameBorder="0" gesture="media" allow="encrypted-media" allowfullscreen="true"></iframe>';
    //   const parsedNode = parseLinks(linkNode);
    //   expect(parsedNode.type).toEqual('html');
    //   expect(parsedNode.value).toEqual(iframeValue);
    // });
  });

  describe('Vimeo', () => {
    it('returns expected iframe node for vimeo link', () => {
      const linkNode = JSON.parse(`{"type":"link",
        "title":null,
        "url":"https://vimeo.com/94950270",
        "children":[{"type":"text","value":"Video : Spotify","position":{"start":{"line":23,"column":2,"offset":534},"end":{"line":23,"column":17,"offset":549}}}],
        "position":{
          "start":{"line":23,"column":1,"offset":533},
          "end":{"line":23,"column":46,"offset":578}
        }
      }`);
      const iframeHTML = '<iframe width="640" height="360" src="https://player.vimeo.com/video/94950270?title=0&byline=0&portrait=0" frameBorder="0" scrolling="no" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>';
      const parsedNode = parseLinks(linkNode);
      expect(parsedNode.value).toEqual(iframeHTML);
    });

    // TODO: skip links with this format
    // it.skip('returns expected iframe node for vimeo link with unusual format', () => {
    //   const linkNode = JSON.parse(`{"type":"link",
    //     "title":null,
    //     "url":"https://vimeo.com/503607618/7619450015",
    //     "children":[{"type":"text",
    //      "value":"Video : Other vimeo link",
    //      "position":{"start":{"line":24,"column":2,"offset":580},
    //      "end":{"line":24,"column":26,"offset":604}}}],
    //     "position":{
    //       "start":{"line":24,"column":1,"offset":579},
    //       "end":{"line":24,"column":67,"offset":645}
    //     }
    //   }`);
    //   const iframeHTML = '<iframe width="640" height="360" src="https://player.vimeo.com/video/503607618/7619450015?title=0&byline=0&portrait=0" frameBorder="0" scrolling="no" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>';
    //   const parsedNode = parseLinks(linkNode);
    //   expect(parsedNode.value).toEqual(iframeHTML);
    // });
    it('returns expected iframe node for vimeo link with query string', () => {
      const linkNode = JSON.parse(`{"type":"link",
        "title":null,
        "url":"https://vimeo.com/94950270?h=e9afa939c2&title=1",
        "children":[{"type":"text","value":"Video : Spotify","position":{"start":{"line":22,"column":2,"offset":469},"end":{"line":22,"column":17,"offset":484}}}],
        "position":{
          "start":{"line":22,"column":1,"offset":468},
          "end":{"line":22,"column":67,"offset":534}
        }
      }`);
      const iframeHTML = '<iframe width="640" height="360" src="https://player.vimeo.com/video/94950270?title=1&byline=0&portrait=0&h=e9afa939c2" frameBorder="0" scrolling="no" allowfullscreen="true" mozallowfullscreen="true" webkitallowfullscreen="true"></iframe>';
      const parsedNode = parseLinks(linkNode);
      expect(parsedNode.type).toEqual('html');
      expect(parsedNode.value).toEqual(iframeHTML);
    });
  });

  // it('returns the same link node for links not supported by linkProviders', () => {
  //   // wistia example
  //   const linkNode = '';
  //   console.log(linkNode);
  //   expect(parseLinks(linkNode)).toEqual(linkNode);
  // });
});
// what about support for
// // [![Menu Hambúrguer](https://img.youtube.com/vi/5fzzEx7-a5k/0.jpg)](https://www.youtube.com/watch?v=5fzzEx7-a5k)
