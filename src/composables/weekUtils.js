// is_rest_week is the single source of truth; week_number is only meaningful on non-rest weeks
// A rest week keeps its last number (0 = never assigned) so toggling rest off restores the admin's choice

/**
 * @param {Object} week - A workout_weeks row
 * @returns {boolean}
 */
export const isRestWeek = (week) => {
  if (!week) return false;

  // Legacy rows encode rest as week_number 0; the backend normalizes on fetch, so this only catches locally-built rows
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
 * True when the week's Monday has arrived — success-rate denominators only count
 * started weeks so an in-progress quarter isn't diluted by its future weeks
 * @param {Object} week - A workout_weeks row
 * @returns {boolean}
 */
export const hasWeekStarted = (week) => {
  if (!week || !week.start_date) return false;
  const startIso = String(week.start_date).split(' ')[0].split('T')[0];
  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return startIso <= todayIso;
};

/**
 * '8월 1주차' (August week 1) / '8월 휴식주간' (August rest week)
 */
export const formatWeekLabel = (week) => {
  if (!week) return '미지정';
  return isRestWeek(week) ? `${week.month}월 휴식주간` : `${week.month}월 ${week.week_number}주차`;
};

/**
 * '1주차' (week N) / '휴식주간' (rest week) - the month-less variant used in exports and headings
 */
export const formatWeekNumberLabel = (week) => {
  if (!week) return '미지정';
  return isRestWeek(week) ? '휴식주간' : `${week.week_number}주차`;
};
