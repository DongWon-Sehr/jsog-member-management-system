/**
 * Service for managing detailed individual workout logs
 */
const WorkoutLogService = {
  /**
   * Adds a new detailed workout log
   * 
   * @param {string} memberId - The UUID of the member
   * @param {string} workoutDate - Date and time of the workout (e.g., 'YYYY-MM-DD HH:mm')
   * @param {string} workoutType - Type of workout (e.g., 'Running', 'Walking')
   * @param {number} durationMinutes - Duration in minutes
   */
  addWorkoutLog(memberId, workoutDate, workoutType, durationMinutes) {
    const sheet = Util.getSheet('workout_logs');
    if (!sheet) throw new Error('workout_logs sheet not found');

    const newLog = {
      id: Util.generateUUID(),
      member_id: memberId,
      workout_date: workoutDate,
      workout_type: workoutType,
      duration_minutes: durationMinutes,
      created_at: Util.getCurrentTimestamp()
    };

    // Create array matching the header order
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = headers.map(header => newLog[header] !== undefined ? newLog[header] : '');
    
    sheet.appendRow(rowData);
    return newLog;
  },

  /**
   * Retrieves all workout logs for a specific member
   */
  getLogsByMember(memberId) {
    const sheet = Util.getSheet('workout_logs');
    if (!sheet) throw new Error('workout_logs sheet not found');

    const logs = Util.sheetToObjects(sheet);
    const filtered = logs.filter(log => log.member_id === memberId);
    return Util.sanitizeData(filtered);
  }
};
