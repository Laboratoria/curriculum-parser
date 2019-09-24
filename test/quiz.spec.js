const helpers = require('./helpers');
const quiz = require('../lib/quiz');
const common = require('../lib/common');


describe('quiz', () => {
  it('should throw when question is missing options', () => {
    const quizReadme = helpers.readFixtureFile('00-quiz-missing-options/README.md');
    const parsedQuizReadme = common.parseReadme(quizReadme, {
      tipo: 'type',
      formato: 'format',
      duración: 'duration',
    });
    expect(() => quiz(parsedQuizReadme.body))
      .toThrowError(/Missing answers/i);
  });

  it('should throw when question is missing answers', () => {
    const quizReadme = helpers.readFixtureFile('00-quiz-missing-answers/README.md');
    const parsedQuizReadme = common.parseReadme(quizReadme, {
      tipo: 'type',
      formato: 'format',
      duración: 'duration',
    });
    expect(() => quiz(parsedQuizReadme.body))
      .toThrowError(/Missing answers/i);
  });

  it('should throw when question is missing solution', () => {
    const quizReadme = helpers.readFixtureFile('00-quiz-missing-solution/README.md');
    const parsedQuizReadme = common.parseReadme(quizReadme, {
      tipo: 'type',
      formato: 'format',
      duración: 'duration',
    });
    expect(() => quiz(parsedQuizReadme.body))
      .toThrowError(/Missing solution/i);
  });

  it('should throw when unexpected element in question', () => {
    const quizReadme = helpers.readFixtureFile('00-quiz-unexpected-element/README.md');
    const parsedQuizReadme = common.parseReadme(quizReadme, {
      tipo: 'type',
      formato: 'format',
      duración: 'duration',
    });
    expect(() => quiz(parsedQuizReadme.body))
      .toThrowError(/Unexpected element/i);
  });

  it('should parse quiz from html created from README.md', () => {
    const quizReadme = helpers.readFixtureFile('00-quiz/README.md');
    const parsedQuizReadme = common.parseReadme(quizReadme, {
      tipo: 'type',
      formato: 'format',
      duración: 'duration',
    });
    const quizQuestions = quiz(parsedQuizReadme.body);
    expect(Array.isArray(quizQuestions)).toBe(true);
    expect(quizQuestions.length).toBe(25);
    expect(quizQuestions).toMatchSnapshot();
  });
});
