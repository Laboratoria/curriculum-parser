const { JSDOM } = require('jsdom');


const getNextSiblings = (node, tagName) => {
  const siblings = [];
  let { nextSibling } = node;

  while (nextSibling) {
    if (nextSibling.tagName === tagName.toUpperCase()) {
      siblings.push(nextSibling);
    }
    nextSibling = nextSibling.nextSibling;
  }

  return siblings;
};

const getNextUntil = (node, tagName) => {
  const results = [];
  let { nextSibling } = node;

  while (nextSibling) {
    if (nextSibling.tagName === tagName.toUpperCase()) {
      break;
    }
    if (nextSibling.tagName) {
      results.push(nextSibling);
    }
    nextSibling = nextSibling.nextSibling;
  }

  return results;
};


module.exports = (body) => {
  const { window } = new JSDOM(body);

  return [...window.document.querySelectorAll('h3')].map((h3) => {
    const optionsH4 = getNextSiblings(h3, 'h4')[0];

    return {
      title: h3.textContent,
      description: getNextUntil(h3, 'h4').map(el => el.outerHTML).join(''),
      answers: [...getNextSiblings(optionsH4, 'ol')[0].children].map(el => el.innerHTML),
      solution: [...getNextSiblings(optionsH4, 'p')].reduce(
        (memo, p) => {
          if (memo) {
            return memo;
          }
          const solution = p.querySelectorAll('solution')[0];
          if (!solution) {
            return memo;
          }
          return solution.textContent.split(',').map(n => parseInt(n, 10) - 1);
        },
        null,
      ),
    };
  });
};
