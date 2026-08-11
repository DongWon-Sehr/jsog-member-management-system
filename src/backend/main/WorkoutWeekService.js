/**
 * Service for managing operational weeks
 *
 * Identity model:
 * - A week is identified by its `start_date`. `year`, `month` and `week_number` are labels the
 *   admin assigns by hand (a week starting on the last day of a month may well be labelled as the
 *   next month's 1st week), so they must never be used to locate the row to update.
 * - `is_rest_week` is the single source of truth for rest weeks. A rest week carries no workout
 *   week number; `week_number` is kept only so toggling rest off restores the admin's last choice.
 * - `(year, month, week_number)` is the join key for workout_records and must be unique *among
 *   non-rest weeks only* - that is exactly the set of weeks that can hold records.
 */
const WorkoutWeekService = {
  tableName: 'workout_weeks',

  get sheet() {
    if (!this._sheet) {
      this._sheet = Util.getSheet(this.tableName);
      if (!this._sheet) throw new Error(`${this.tableName} sheet not found`);
    }
    return this._sheet;
  },

  /**
   * True when the week is a rest week (no workout is expected, holds no records)
   * @param {Object} week
   * @returns {boolean}
   */
  isRestWeek(week) {
    if (!week) return false;

    // Legacy rows predate is_rest_week and encode rest as week_number 0; drop once run_migrateWorkoutWeeksRestFlag has run everywhere
    if (week.is_rest_week === '' || week.is_rest_week === null || week.is_rest_week === undefined) {
      return Number(week.week_number) === 0;
    }

    return Util.toBoolean(week.is_rest_week);
  },

  /**
   * Human-readable label for a week, e.g. '8월 1주차' or '8월 휴식주간'
   */
  formatWeekLabel(week) {
    if (!week) return '미지정';
    return this.isRestWeek(week) ? `${week.month}월 휴식주간` : `${week.month}월 ${week.week_number}주차`;
  },

  /**
   * Retrieves all weeks, with is_rest_week normalized to a real boolean
   */
  getAllWeeks() {
    const weeks = Util.sanitizeData(Util.sheetToObjects(this.sheet, this.tableName));
    return weeks.map(week => {
      week.is_rest_week = this.isRestWeek(week);
      return week;
    });
  },

  /**
   * Retrieves the weeks that can hold workout records (everything but rest weeks)
   */
  getWorkoutWeeks() {
    return this.getAllWeeks().filter(week => !week.is_rest_week);
  },

  /**
   * Finds the workout week matching a composite key (year-month-week_number).
   * Rest weeks are excluded on purpose: they carry no week number, so a lookup by number must
   * never resolve to one.
   * @param {number} year
   * @param {number} month
   * @param {number} weekNumber
   * @returns {Object|null} The week object or null if not found
   */
  getWeek(year, month, weekNumber) {
    if (!Util.hasWeekNumber(weekNumber)) return null;

    return this.getWorkoutWeeks().find(week =>
      String(week.year) === String(year) &&
      String(week.month) === String(month) &&
      String(week.week_number) === String(weekNumber)
    ) || null;
  },

  /**
   * Finds the operational week that contains the given date.
   * Rest weeks are included - callers need to be able to detect that the date falls on one.
   * @param {string} dateString - Date string in 'YYYY-MM-DD' format
   * @returns {Object|null} The week object or null if not found
   */
  getWeekByDate(dateString) {
    const weeks = this.getAllWeeks();
    const targetDate = new Date(dateString);
    targetDate.setHours(0, 0, 0, 0);

    return weeks.find(week => {
      const start = new Date(week.start_date);
      start.setHours(0, 0, 0, 0);
      const end = new Date(week.end_date);
      end.setHours(23, 59, 59, 999);

      return targetDate >= start && targetDate <= end;
    }) || null;
  },

  /**
   * Rewrites every week whose start_date falls inside the payload's span.
   *
   * The planner submits a full, self-consistent year at once, so the block is rebuilt rather than
   * upserted row by row. Rebuilding is what makes an edit deterministic: renumbering a week used
   * to leave the old (year, month, week_number) row behind as a duplicate, because the composite
   * key it was matched on is the very thing the admin was editing.
   *
   * `id` and `created_at` are carried over from the row with the same start_date so week
   * references held by the client stay stable.
   *
   * @param {Array} weeksArray - Array of week objects
   */
  batchSaveWeeks(weeksArray) {
    if (!Array.isArray(weeksArray) || weeksArray.length === 0) return true;

    const payload = weeksArray.map(week => this._normalizeWeekInput(week));
    this._assertPayloadIsConsistent(payload);

    const sheet = this.sheet;
    const data = sheet.getDataRange().getValues();
    const headers = data[0];

    const startDateIndex = headers.indexOf('start_date');
    const idIndex = headers.indexOf('id');
    const createdAtIndex = headers.indexOf('created_at');

    if (startDateIndex === -1) throw new Error(`'start_date' column not found in ${this.tableName}`);

    // Scope by start_date, never by year/month: those are admin labels and may cross the span
    const sortedStarts = payload.map(week => week.start_date).sort();
    const spanStart = sortedStarts[0];
    const spanEnd = sortedStarts[sortedStarts.length - 1];

    const payloadStartDates = {};
    payload.forEach(week => { payloadStartDates[week.start_date] = true; });

    const preservedRows = [];
    const carriedIdentities = {};
    const orphanStartDates = [];

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.every(cell => cell === '' || cell === null)) continue;

      const startDate = Util.toDateString(row[startDateIndex]);

      if (startDate && startDate >= spanStart && startDate <= spanEnd) {
        // In-span rows the planner did not produce (off the Monday grid) would be dropped; refuse rather than lose them
        if (!payloadStartDates[startDate]) {
          if (orphanStartDates.indexOf(startDate) === -1) orphanStartDates.push(startDate);
          continue;
        }

        // Rows sharing a start_date collapse into one, repairing duplicates left by the old upsert
        if (!carriedIdentities[startDate]) {
          carriedIdentities[startDate] = {
            id: idIndex === -1 ? '' : row[idIndex],
            created_at: createdAtIndex === -1 ? '' : row[createdAtIndex]
          };
        }
      } else {
        preservedRows.push(row);
      }
    }

    if (orphanStartDates.length > 0) {
      throw new Error(`[주차 저장 오류] 저장 범위(${spanStart} ~ ${spanEnd}) 안에 플래너가 만들지 않은 주차가 있습니다: ${orphanStartDates.sort().join(', ')} (시작일이 월요일이 아닌 행일 수 있습니다.) 시트에서 해당 행을 확인·정리한 뒤 다시 저장해주세요.`);
    }

    const timestamp = Util.getCurrentTimestamp();

    const rebuiltRows = payload.map(week => {
      const carried = carriedIdentities[week.start_date];
      const record = {
        id: carried && carried.id ? carried.id : Util.generateUUID(),
        year: week.year,
        month: week.month,
        week_number: week.week_number,
        start_date: week.start_date,
        end_date: week.end_date,
        created_at: carried && carried.created_at ? carried.created_at : timestamp,
        is_rest_week: week.is_rest_week
      };
      return headers.map(header => (record[header] !== undefined ? record[header] : ''));
    });

    // Keep chronological order: the sheet is read by hand and rewritten blocks would sink to the bottom
    const finalRows = preservedRows.concat(rebuiltRows).sort((rowA, rowB) => {
      const dateA = Util.toDateString(rowA[startDateIndex]);
      const dateB = Util.toDateString(rowB[startDateIndex]);
      if (dateA === dateB) return 0;
      return dateA < dateB ? -1 : 1;
    });

    const lastRow = sheet.getLastRow();

    if (lastRow > 1) {
      sheet.getRange(2, 1, lastRow - 1, headers.length).clearContent();
    }
    if (finalRows.length > 0) {
      sheet.getRange(2, 1, finalRows.length, headers.length).setValues(finalRows);
    }

    return true;
  },

  /**
   * Coerces one client-supplied week into the shape stored in the sheet
   */
  _normalizeWeekInput(week) {
    const isRestWeek = Util.toBoolean(week.is_rest_week);
    const startDate = Util.toDateString(week.start_date);
    const endDate = Util.toDateString(week.end_date);

    if (!startDate) throw new Error('[주차 저장 오류] start_date가 없는 주차가 있습니다.');
    if (!endDate) throw new Error(`[주차 저장 오류] ${startDate} 주차에 end_date가 없습니다.`);

    return {
      year: Number(week.year),
      month: Number(week.month),
      // Rest weeks keep their last number (0 = never assigned) so the admin's choice survives a rest toggle
      week_number: Util.hasWeekNumber(week.week_number) ? Number(week.week_number) : 0,
      start_date: startDate,
      end_date: endDate,
      is_rest_week: isRestWeek
    };
  },

  /**
   * Rejects a payload that would corrupt the sheet, before anything is written
   */
  _assertPayloadIsConsistent(payload) {
    const seenStartDates = {};
    const seenLabels = {};

    payload.forEach(week => {
      if (seenStartDates[week.start_date]) {
        throw new Error(`[주차 저장 오류] 시작일 ${week.start_date}이(가) 중복 전달되었습니다.`);
      }
      seenStartDates[week.start_date] = true;

      if (week.is_rest_week) return;

      if (!Util.hasWeekNumber(week.week_number)) {
        throw new Error(`[주차 저장 오류] ${week.start_date} 주는 운동주간인데 주차 번호가 지정되지 않았습니다.`);
      }

      // Unique only among non-rest weeks: this is the join key for workout_records
      const label = `${week.year}-${week.month}-${week.week_number}`;
      if (seenLabels[label]) {
        throw new Error(`[주차 저장 오류] ${week.year}년 ${week.month}월 ${week.week_number}주차가 중복 지정되었습니다. (${seenLabels[label]}, ${week.start_date})`);
      }
      seenLabels[label] = week.start_date;
    });
  }
};
