/**
 * Computes a matching percentage and reasons for compatibility between two student profiles.
 * @param {Object} studentA - The active student profile.
 * @param {Object} studentB - The prospective match student profile.
 * @returns {Object} { score: number, reasons: string[] }
 */
export function calculateMatchScore(studentA, studentB) {
  if (!studentA || !studentB || studentA.id === studentB.id) {
    return { score: 0, reasons: [] };
  }

  let totalScore = 0;
  const reasons = [];

  // 1. Course Overlap (Weight: 40%)
  const coursesA = studentA.courses || [];
  const coursesB = studentB.courses || [];
  const commonCourses = coursesA.filter(c => coursesB.includes(c));
  
  if (commonCourses.length > 0) {
    const courseScore = Math.min(40, (commonCourses.length / Math.max(1, coursesA.length)) * 40);
    totalScore += courseScore;
    
    // Shorten course names for reasons
    const shortNames = commonCourses.map(c => c.split(':')[0]);
    reasons.push(`Shared course${commonCourses.length > 1 ? 's' : ''}: ${shortNames.join(', ')}`);
  }

  // 2. Availability Overlap (Weight: 30%)
  let overlapSlots = 0;
  const days = Object.keys(studentA.availability || {});
  
  days.forEach(day => {
    const slotsA = studentA.availability[day] || [];
    const slotsB = (studentB.availability && studentB.availability[day]) || [];
    const intersection = slotsA.filter(slot => slotsB.includes(slot));
    overlapSlots += intersection.length;
  });

  if (overlapSlots > 0) {
    // 5+ slots is considered a full match for schedule
    const scheduleScore = Math.min(30, (overlapSlots / 5) * 30);
    totalScore += scheduleScore;
    reasons.push(`${overlapSlots} shared availability slot${overlapSlots > 1 ? 's' : ''} weekly`);
  }

  // 3. Study Style Matching (Weight: 20%)
  const styleA = studentA.studyStyle;
  const styleB = studentB.studyStyle;
  
  if (styleA && styleB) {
    if (styleA === styleB) {
      totalScore += 20;
      const displayStyle = styleA.charAt(0).toUpperCase() + styleA.slice(1);
      reasons.push(`Perfect study style match: both prefer ${displayStyle}`);
    } else {
      // Complementary styles
      const isComplementary = (styleA === 'discussion' && styleB === 'visual') || 
                              (styleA === 'visual' && styleB === 'discussion') ||
                              (styleA === 'intensive' && styleB === 'review') ||
                              (styleA === 'review' && styleB === 'intensive');
      
      if (isComplementary) {
        totalScore += 12;
        reasons.push('Highly compatible and complementary study styles');
      } else {
        totalScore += 5; // Minimal partial match
      }
    }
  }

  // 4. Learning Goals Overlap (Weight: 10%)
  const goalsA = studentA.learningGoals || [];
  const goalsB = studentB.learningGoals || [];
  const commonGoals = goalsA.filter(g => goalsB.includes(g));

  if (commonGoals.length > 0) {
    const goalsScore = Math.min(10, (commonGoals.length / Math.max(1, goalsA.length)) * 10);
    totalScore += goalsScore;
    reasons.push(`Shared focus: ${commonGoals[0]}${commonGoals.length > 1 ? ` & ${commonGoals.length - 1} other goal(s)` : ''}`);
  }

  // Round score to nearest integer
  const finalScore = Math.round(totalScore);

  return {
    score: finalScore,
    reasons: reasons
  };
}

/**
 * Ranks a list of prospective students against a target student profile.
 * @param {Object} targetStudent - The active student profile.
 * @param {Array} studentList - List of all student profiles.
 * @returns {Array} List of students with match score and reasons appended, sorted descending.
 */
export function getSortedMatches(targetStudent, studentList) {
  if (!targetStudent) return [];
  
  return studentList
    .filter(s => s.id !== targetStudent.id)
    .map(student => {
      const matchResult = calculateMatchScore(targetStudent, student);
      return {
        ...student,
        matchScore: matchResult.score,
        matchReasons: matchResult.reasons
      };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}
