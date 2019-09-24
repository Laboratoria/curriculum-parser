const { JSDOM } = require('jsdom');


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
    const questionElements = getNextUntil(h3, 'h3');
    const question = questionElements.reduce(
      (memo, item) => {
        if (typeof memo.description !== 'string' && item.tagName === 'H4') {
          return {
            ...memo,
            description: memo.description.join(''),
          };
        }
        if (typeof memo.description !== 'string') {
          return {
            ...memo,
            description: [...memo.description, item.outerHTML],
          };
        }
        if (item.tagName === 'OL') {
          return {
            ...memo,
            answers: [...item.children].map(child => child.innerHTML),
          };
        }
        if (memo.answers.length && item.tagName === 'P') {
          return {
            ...memo,
            solution: item.children[0].textContent.split(',').map(
              n => parseInt(n, 10) - 1,
            ),
          };
        }
        throw new Error(`Unexpected element: ${item.outerHTML}`);
      },
      {
        title: h3.textContent,
        description: [],
        answers: [],
        solution: [],
      },
    );

    if (!question.answers.length) {
      throw new Error(`Missing answers for "${h3.textContent}"`);
    }

    if (!question.solution.length) {
      throw new Error(`Missing solution for "${h3.textContent}"`);
    }

    return question;
  });
};
