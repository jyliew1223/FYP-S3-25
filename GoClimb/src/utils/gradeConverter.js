// GoClimb/src/utils/gradeConverter.js

/**
 * Grade conversion table from numeric to Font scale
 */
const GRADE_TABLE = {
  1: '4',
  2: '5',
  3: '5+',
  4: '6A',
  5: '6A+',
  6: '6B',
  7: '6B+',
  8: '6C',
  9: '6C+',
  10: '7A',
  11: '7A+',
  12: '7B',
  13: '7B+',
  14: '7C',
  15: '7C+',
  16: '8A',
  17: '8A+',
  18: '8B',
  19: '8B+',
  20: '8C',
  21: '8C+',
  22: '9A',
};

/**
 * Convert numeric grade to Font scale
 * @param {number|string} n - Numeric grade
 * @returns {string} Font scale grade (e.g., "6A", "7B+")
 */
export function convertNumericGradeToFont(n) {
  if (n == null) return '—';
  const asNum = Number(n);
  return GRADE_TABLE[asNum] || String(asNum);
}

/**
 * Get all available grades
 * @returns {Array<{value: number, label: string}>}
 */
export function getAllGrades() {
  return Object.entries(GRADE_TABLE).map(([value, label]) => ({
    value: parseInt(value),
    label,
  }));
}
