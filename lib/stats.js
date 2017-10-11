'use strict';


const isFloat = n => Number(n) === n && n % 1 !== 0;


const minutesToHuman = (minutes) => {
  if (minutes >= 60) {
    let hours = minutes / 60;
    if (isFloat(hours)) {
      hours = hours.toFixed(1);
      const hourParts = `${hours}`.split('.');
      if (parseInt(hourParts[1], 10) === 0) {
        hours = hourParts[0];
      }
    }
    return `${hours}h`;
  }
  return `${minutes}min`;
};


const computeUnitStats = (unit) => Object.keys(unit.parts || {}).reduce(
  (memo, partKey) => {
    const part = memo.parts[partKey];
    const duration = memo.stats.duration + part.duration;
    return {
      ...memo,
      parts: {
        ...memo.parts,
        [partKey]: {
          ...part,
          durationString: minutesToHuman(part.duration),
        },
      },
      stats: {
        ...memo.stats,
        duration,
        durationString: minutesToHuman(duration),
        exerciseCount: memo.stats.exerciseCount + (part.exercises ? Object.keys(part.exercises).length : 0)
      },
    };
  },
  {
    ...unit,
    stats: {
      duration: 0,
      durationString: '',
      exerciseCount: 0,
      partCount: Object.keys(unit.parts || {}).length,
    }
  },
);


const computeSyllabusStats = syllabus => Object.keys(syllabus).reduce(
  (memo, unitKey) => ({
    ...memo,
    [unitKey]: computeUnitStats(syllabus[unitKey]),
  }),
  { ...syllabus },
);


const computeCourseStats = (course) => {
  const syllabus = computeSyllabusStats(course.syllabus);
  return {
    ...course,
    createdAt: new Date(),
    syllabus,
    stats: Object.keys(syllabus).reduce((memo, unitKey) => {
      const duration = memo.duration + syllabus[unitKey].stats.duration;
      return {
        ...memo,
        duration,
        durationString: minutesToHuman(duration),
        exerciseCount: memo.exerciseCount + syllabus[unitKey].stats.exerciseCount,
        partCount: memo.partCount + Object.keys(syllabus[unitKey].parts).length,
      };
    }, {
      duration: 0,
      durationString: '',
      exerciseCount: 0,
      unitCount: Object.keys(syllabus).length,
      partCount: 0,
    })
  };
};


module.exports = results => ({
  ...results,
  courses: Object.keys(results.courses).reduce((memo, key) => ({
    ...memo,
    [key]: computeCourseStats(results.courses[key]),
  }), {})
});
