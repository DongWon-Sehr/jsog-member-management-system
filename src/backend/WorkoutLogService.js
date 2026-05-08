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
   * Batch adds and deletes workout logs, then syncs the weekly count.
   * 
   * @param {string} memberId 
   * @param {number} year 
   * @param {number} month 
   * @param {number} weekNumber 
   * @param {Array} logsToAdd - Array of log objects { workout_date, workout_type, duration_minutes }
   * @param {Array} logIdsToDelete - Array of log UUIDs
   */
  batchSaveWorkoutLogs(memberId, year, month, weekNumber, logsToAdd, logIdsToDelete) {
    // 1. Delete logs
    if (logIdsToDelete && logIdsToDelete.length > 0) {
      const data = this.sheet.getDataRange().getValues();
      const headers = data[0];
      const idIndex = headers.indexOf('id');
      
      // Iterate backwards to avoid row index shifting
      for (let i = data.length - 1; i >= 1; i--) {
        if (logIdsToDelete.includes(data[i][idIndex])) {
          this.sheet.deleteRow(i + 1);
        }
      }
    }

    // 2. Add logs
    const createdLogs = [];
    if (logsToAdd && logsToAdd.length > 0) {
      const headers = this.sheet.getRange(1, 1, 1, this.sheet.getLastColumn()).getValues()[0];
      const timestamp = Util.getCurrentTimestamp();
      
      logsToAdd.forEach(log => {
        const newLog = {
          id: Util.generateUUID(),
          member_id: memberId,
          workout_date: log.workout_date,
          workout_type: log.workout_type,
          duration_minutes: log.duration_minutes,
          created_at: timestamp
        };
        const rowData = headers.map(header => newLog[header] !== undefined ? newLog[header] : '');
        this.sheet.appendRow(rowData);
        createdLogs.push(newLog);
      });
    }

    // 3. Sync count
    const netChange = (logsToAdd ? logsToAdd.length : 0) - (logIdsToDelete ? logIdsToDelete.length : 0);
    if (netChange !== 0 && year && month && weekNumber) {
      WorkoutService.incrementWorkoutCount(memberId, year, month, weekNumber, netChange);
    }

    return { added: createdLogs, deletedCount: logIdsToDelete ? logIdsToDelete.length : 0 };
  },

  /**
   * Adds a new detailed workout log and syncs the weekly count
   * 
   * @param {string} memberId - The UUID of the member
   * @param {string} workoutDate - Date and time of the workout
   * @param {string} workoutType - Type of workout
   * @param {number} durationMinutes - Duration in minutes
   * @param {number} year - Year for syncing count
   * @param {number} month - Month for syncing count
   * @param {number} weekNumber - Week number for syncing count
   */
  addWorkoutLog(memberId, workoutDate, workoutType, durationMinutes, year, month, weekNumber) {
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

    // Sync count (+1)
    if (year && month && weekNumber) {
      WorkoutService.incrementWorkoutCount(memberId, year, month, weekNumber, 1);
    }

    return newLog;
  },

  /**
   * Deletes a workout log and syncs the weekly count
   * 
   * @param {string} logId - The UUID of the log to delete
   * @param {string} memberId - The UUID of the member
   * @param {number} year - Year for syncing count
   * @param {number} month - Month for syncing count
   * @param {number} weekNumber - Week number for syncing count
   */
  deleteWorkoutLog(logId, memberId, year, month, weekNumber) {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');

    if (idIndex === -1) throw new Error('ID column not found in workout_logs');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === logId) {
        this.sheet.deleteRow(i + 1);
        
        // Sync count (-1)
        if (memberId && year && month && weekNumber) {
          WorkoutService.incrementWorkoutCount(memberId, year, month, weekNumber, -1);
        }
        
        return true;
      }
    }
    return false;
  },

  /**
   * Retrieves all workout logs for a specific member
   */
  getLogsByMember(memberId) {
    const logs = Util.sheetToObjects(this.sheet, this.tableName);
    const filtered = logs.filter(log => log.member_id === memberId);
    return Util.sanitizeData(filtered);
  },

  /**
   * Retrieves all workout logs
   */
  getAllLogs() {
    return Util.sheetToObjects(this.sheet, this.tableName);
  }
};
