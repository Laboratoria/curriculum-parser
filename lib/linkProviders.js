import queryString from 'node:querystring';
import url from 'node:url';

const getAttributeString = attrsObject => Object.entries(attrsObject).map(([k, v]) => `${k}="${v}"`).join(' ');

const linkProviders = [{
  id: 'vimeo',
  // this second test allows us to skip vimeo links with the unique format /id/id
  test: urlObj => urlObj.hostname === 'vimeo.com' && urlObj.path.replace(/^\/|\/$/g, '').split('/').length <= 1,
  // getObject: (linkNode, urlObj) => ({
  //   type: 'video',
  //   provider: 'vimeo',
  //   href: linkNode.url,
  //   id: urlObj.pathname.slice(1),
  // }),
  getHTML: (urlObj) => {
    const videoId = urlObj.pathname.slice(1);
    const qs = queryString.encode({
      title: 0,
      byline: 0,
      portrait: 0,
      ...queryString.decode(urlObj.query),
    });
    const src = `https://player.vimeo.com/video/${videoId}?${qs}`;
    const attributes = {
      width: 640,
      height: 360,
      src,
      frameBorder: '0',
      scrolling: 'no',
      allowfullscreen: 'true',
      mozallowfullscreen: 'true',
      webkitallowfullscreen: 'true',
    };

    return `<iframe ${getAttributeString(attributes)}></iframe>`;
  },
},
{
  id: 'youtube',
  test: (urlObj, qs) => (
    urlObj.hostname === 'youtu.be'
    || (
      urlObj.hostname === 'www.youtube.com'
      && urlObj.pathname === '/watch'
      && qs.v
    )
  ),
  // getObject: (a, urlObj, qs) => ({
  //   type: 'video',
  //   provider: 'youtube',
  //   href: a.href,
  //   id: urlObj.hostname === 'youtu.be' ? urlObj.pathname.slice(1) : qs.v,
  // }),
  getHTML: (urlObj, { v, ...qs }) => {
    const videoId = urlObj.hostname === 'youtu.be' ? urlObj.pathname.slice(1) : v;
    const params = queryString.stringify({ ...qs, autoplay: 0 });
    const attributes = {
      width: 640,
      height: 360,
      src: `https://www.youtube.com/embed/${videoId}?${params}`,
      frameBorder: '0',
      gesture: 'media',
      allow: 'encrypted-media',
      allowfullscreen: 'true',
    };
    return `<iframe ${getAttributeString(attributes)}></iframe>`;
  },
}];

const transformLink = (node) => {
  const urlObj = url.parse(node.url);
  const qs = queryString.parse(urlObj.query);
  const provider = linkProviders.find(item => item.test(urlObj, qs));

  if (!provider) {
    return node;
  }

  // Note: at this point the nodes are mdast markdown
  // and if we want to transform to an iframe
  // we have to set the node to type html https://github.com/syntax-tree/mdast#nodes
  // with the value of the raw html
  // example {type: 'html', value: '<div>'}

  // TODO use children text for iframe title
  // https://www.boia.org/blog/why-are-iframe-titles-important-for-accessibility
  // TODO put in iframe container https://github.com/Laboratoria/curriculum-parser/blob/main/lib/common.js#L315
  const htmlNode = { ...node, type: 'html', value: provider.getHTML(urlObj, qs) };
  return htmlNode;
};

export const parseLinks = (node) => {
  if (node.type === 'link') {
    const linkProps = transformLink(node);
    Object.assign(node, linkProps);
  }
  if (node.children?.length) {
    return { ...node, children: node.children.map(n => parseLinks(n)) };

    /* for testing
    const newNode = { ...node, children: node.children.map(n => parseLinks(n)) };
    if (newNode.type === 'html') {
      console.log(newNode, newNode.value);
    }
    return newNode; */
  }
  return node;
};
