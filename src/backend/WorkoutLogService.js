/**
 * Service for managing detailed individual workout logs
 */
const WorkoutLogService = {
  tableName: 'workout_logs',
  
  get sheet() {
    if (!this._sheet) {
      this._sheet = Util.getSheet(this.tableName);
      if (!this._sheet) throw new Error(`${this.tableName} sheet not found`);
    }
    return this._sheet;
  },

  /**
   * Adds a new detailed workout log
   * 
   * @param {string} memberId - The UUID of the member
   * @param {string} workoutDate - Date and time of the workout (e.g., 'YYYY-MM-DD HH:mm')
   * @param {string} workoutType - Type of workout (e.g., 'Running', 'Walking')
   * @param {number} durationMinutes - Duration in minutes
   */
  addWorkoutLog(memberId, workoutDate, workoutType, durationMinutes) {
    const newLog = {
      id: Util.generateUUID(),
      member_id: memberId,
      workout_date: workoutDate,
      workout_type: workoutType,
      duration_minutes: durationMinutes,
      created_at: Util.getCurrentTimestamp()
    };

    // Create array matching the header order
    const headers = this.sheet.getRange(1, 1, 1, this.sheet.getLastColumn()).getValues()[0];
    const rowData = headers.map(header => newLog[header] !== undefined ? newLog[header] : '');
    
    this.sheet.appendRow(rowData);
    return newLog;
  },

  /**
   * Retrieves all workout logs for a specific member
   */
  getLogsByMember(memberId) {
    const logs = Util.sheetToObjects(this.sheet, this.tableName);
    const filtered = logs.filter(log => log.member_id === memberId);
    return Util.sanitizeData(filtered);
  }
};
