/**
 * Service for managing operational weeks
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
   * Retrieves all weeks
   */
  getAllWeeks() {
    return Util.sanitizeData(Util.sheetToObjects(this.sheet, this.tableName));
  },

  /**
   * Finds the operational week matching a composite key (year-month-week_number)
   * @param {number} year
   * @param {number} month
   * @param {number} weekNumber
   * @returns {Object|null} The week object or null if not found
   */
  getWeek(year, month, weekNumber) {
    return this.getAllWeeks().find(week =>
      String(week.year) === String(year) &&
      String(week.month) === String(month) &&
      String(week.week_number) === String(weekNumber)
    ) || null;
  },

  /**
   * Finds the operational week that contains the given date
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
   * Batch upserts weeks based on composite key (year-month-week_number)
   * @param {Array} weeksArray - Array of week objects
   */
  batchSaveWeeks(weeksArray) {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Create a map of existing composite keys to their row index (1-based)
    const yearIndex = headers.indexOf('year');
    const monthIndex = headers.indexOf('month');
    const weekNumberIndex = headers.indexOf('week_number');
    
    const existingMap = {};
    
    for (let i = 1; i < data.length; i++) {
      const year = String(data[i][yearIndex]);
      const month = String(data[i][monthIndex]);
      const weekNumber = String(data[i][weekNumberIndex]);
      const compositeKey = `${year}-${month}-${weekNumber}`;
      existingMap[compositeKey] = i + 1;
    }

    const timestamp = Util.getCurrentTimestamp();

    weeksArray.forEach(weekData => {
      const { year, month, week_number, start_date, end_date } = weekData;
      const compositeKey = `${String(year)}-${String(month)}-${String(week_number)}`;
      const rowIndex = existingMap[compositeKey];

      if (rowIndex) {
        // Update existing row
        this.sheet.getRange(rowIndex, headers.indexOf('start_date') + 1).setValue(start_date);
        this.sheet.getRange(rowIndex, headers.indexOf('end_date') + 1).setValue(end_date);
        // Not updating created_at to preserve original creation time
      } else {
        // Insert new row
        const newWeek = {
          id: Util.generateUUID(),
          year: year,
          month: month,
          week_number: week_number,
          start_date: start_date,
          end_date: end_date,
          created_at: timestamp
        };
        const rowData = headers.map(header => newWeek[header] !== undefined ? newWeek[header] : '');
        this.sheet.appendRow(rowData);
      }
    });
    
    return true;
  }
};
