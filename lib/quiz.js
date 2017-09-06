'use strict';


const Cheerio = require('cheerio');


const internals = {};


internals.getNexElementstUntil = ($el, tagName) => {
  const $next = $el.next();

  if (!$next.length) {
    return [];
  }

  if ($next.get(0).tagName === tagName) {
    return [];
  }

  return [$next].concat(internals.getNexElementstUntil($next, tagName));
};


module.exports = body => {
  const $ = Cheerio.load(body);
  return $('h3').map((idx, h3) => {
    const $h3 = $(h3);

    const description = $h3.nextUntil('h4')
      .map((idx, el) => `<${el.tagName}>${$(el).html()}</${el.tagName}>`)
      .get()
      .join('');

    const answers = $h3.nextAll('h4').next('ol').first().children()
      .map((idx, li) => $(li).html())
      .get();

    const solution = $h3.nextAll('solution').first()
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
