/**
 * Helpers for reading workout_weeks rows.
 *
 * `is_rest_week` is the single source of truth for rest weeks. `week_number` is the admin-assigned
 * workout week label and is only meaningful on a non-rest week - a rest week keeps whatever number
 * it was last given (0 = never assigned) so toggling rest off restores the admin's choice.
 */

/**
 * @param {Object} week - A workout_weeks row
 * @returns {boolean}
 */
export const isRestWeek = (week) => {
  if (!week) return false;

  // Legacy bridge: rows written before the is_rest_week column existed encode a rest week as
  // week_number 0. The backend normalizes this in getAllWeeks(), so this only catches rows built
  // locally (optimistic updates) before a refetch.
  if (week.is_rest_week === '' || week.is_rest_week === null || week.is_rest_week === undefined) {
    return Number(week.week_number) === 0;
  }

  return week.is_rest_week === true || String(week.is_rest_week).toUpperCase() === 'TRUE';
};

/**
 * True when the week can hold workout records
 */
export const isWorkoutWeek = (week) => !!week && !isRestWeek(week);

/**
 * '8월 1주차' / '8월 휴식주간'
 */
export const formatWeekLabel = (week) => {
  if (!week) return '미지정';
  return isRestWeek(week) ? `${week.month}월 휴식주간` : `${week.month}월 ${week.week_number}주차`;
};

/**
 * '1주차' / '휴식주간' - the month-less variant used in exports and headings
 */
export const formatWeekNumberLabel = (week) => {
  if (!week) return '미지정';
  return isRestWeek(week) ? '휴식주간' : `${week.week_number}주차`;
};
