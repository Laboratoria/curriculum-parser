const helpers = require('./helpers');
const quiz = require('../lib/quiz');
const common = require('../lib/common');


describe('quiz', () => {
  it('should parse quiz from html created from README.md', () => {
    const quizReadme = helpers.readFixtureFile('00-quiz/README.md');
    const parsedQuizReadme = common.parseReadme(quizReadme, {
      tipo: 'type',
      type: 'type',
      formato: 'format',
      format: 'format',
      duración: 'duration',
      duration: 'duration',
      duração: 'duration',
    });
    const quizQuestions = quiz(parsedQuizReadme.body);
    expect(Array.isArray(quizQuestions)).toBe(true);
    expect(quizQuestions.length).toBe(25);
    expect(quizQuestions).toMatchSnapshot();
  });
});
