const cheerio = require('cheerio');


module.exports = (body) => {
  const $ = cheerio.load(body);
  return $('h3').map((h3Idx, h3) => {
    const $h3 = $(h3);
    const $optionsH4 = $h3.nextAll('h4').first();

    const description = $h3.nextUntil('h4')
      .map((h4Idx, el) => `<${el.tagName}>${$(el).html()}</${el.tagName}>`)
      .get()
      .join('');

    const answers = $optionsH4.next('ol').first().children()
      .map((liIdx, li) => $(li).html())
      .get();

    const solution = $optionsH4.nextAll('p').find('solution').first()
      .text()
      .split(',')
      .map(str => parseInt(str, 10) - 1);

    return {
      title: $h3.text(),
      description,
      answers,
      solution,
    };
  }).get();
};
