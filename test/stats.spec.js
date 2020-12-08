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

  it('should not add decimals to durationString when decimal is 0', () => {
    const { stats } = computeCourseStats({
      syllabus: {
        foo: {
          parts: {
            '01-intro': { duration: 60 },
          },
        },
        bar: {
          parts: {
            '00-opening': { duration: 30 },
            '00-closing': { duration: 30 },
          },
        },
      },
    });

    expect(stats).toMatchSnapshot();
  });

  it('should count exercises', () => {
    const { stats } = computeCourseStats({
      syllabus: {
        foo: {
          parts: {
            '01-intro': { duration: 30 },
          },
        },
        bar: {
          parts: {
            '00-opening': { duration: 5 },
            '01-practice': {
              duration: 30,
              exercises: {
                '01-foo': {},
              },
            },
            '02-closing': { duration: 5 },
          },
        },
      },
    });

    expect(stats).toMatchSnapshot();
  });

  it('should not complain when unit has no parts?', () => {
    const { stats } = computeCourseStats({
      syllabus: {
        foo: {},
      },
    });

    expect(stats).toMatchSnapshot();
  });
});
