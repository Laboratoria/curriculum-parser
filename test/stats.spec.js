const { computeCourseStats } = require('../lib/stats');


describe('stats.computeCourseStats', () => {
  it('should be a function', () => expect(typeof computeCourseStats).toBe('function'));

  it('should compute course duration based on parts duration', () => {
    const { stats } = computeCourseStats({
      syllabus: {
        foo: {
          parts: {
            '01-intro': { duration: 10 },
          },
        },
        bar: {
          parts: {
            '00-opening': { duration: 5 },
            '00-closing': { duration: 5 },
          },
        },
      },
    });

    expect(stats).toMatchSnapshot();
  });
});
