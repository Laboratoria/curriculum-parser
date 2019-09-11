const { computeCourseStats } = require('../lib/stats');


describe('stats.computeCourseStats', () => {
  it('should be a function', () => expect(typeof computeCourseStats).toBe('function'));

  it('should compute course duration based on parts duration', () => {
    const { stats } = computeCourseStats({
      syllabus: {
        foo: {
          parts: {
            '01-intro': { duration: 60 },
          },
        },
        bar: {
          parts: {
            '00-opening': { duration: 20 },
            '00-closing': { duration: 30 },
          },
        },
      },
    });

    expect(stats).toMatchSnapshot();
  });
});
