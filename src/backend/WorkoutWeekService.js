/**
 * Service for managing operational weeks
 */
const WorkoutWeekService = {
  /**
   * Retrieves all weeks
   */
  getAllWeeks() {
    const sheet = Util.getSheet('workout_weeks');
    if (!sheet) throw new Error('workout_weeks sheet not found');
    return Util.sanitizeData(Util.sheetToObjects(sheet));
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
   * Batch upserts weeks based on start_date
   * @param {Array} weeksArray - Array of week objects
   */
  batchSaveWeeks(weeksArray) {
    const sheet = Util.getSheet('workout_weeks');
    if (!sheet) throw new Error('workout_weeks sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    // Create a map of existing start_dates to their row index (1-based)
    const startDateIndex = headers.indexOf('start_date');
    const existingMap = {};
    
    for (let i = 1; i < data.length; i++) {
      // Ensure we treat the stored date as a string for matching
      const storedDate = String(data[i][startDateIndex]);
      existingMap[storedDate] = i + 1;
    }

    const timestamp = Util.getCurrentTimestamp();

    weeksArray.forEach(weekData => {
      const { year, month, week_number, start_date, end_date } = weekData;
      const rowIndex = existingMap[start_date];

      if (rowIndex) {
        // Update existing row
        sheet.getRange(rowIndex, headers.indexOf('year') + 1).setValue(year);
        sheet.getRange(rowIndex, headers.indexOf('month') + 1).setValue(month);
        sheet.getRange(rowIndex, headers.indexOf('week_number') + 1).setValue(week_number);
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
        sheet.appendRow(rowData);
      }
    });
    
    return true;
  }
};
