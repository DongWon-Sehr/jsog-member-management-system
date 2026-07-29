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
   * Normalizes a sheet/client value into a 'YYYY-MM-DD' string
   */
  toDateString(value) {
    if (value instanceof Date) {
      const pad = n => (n < 10 ? '0' + n : n);
      return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
    }
    return String(value || '').trim().split(' ')[0].split('T')[0];
  },

  /**
   * Counts a member's logs whose workout_date falls within an inclusive date range
   *
   * @param {string} memberId
   * @param {string} startDate - 'YYYY-MM-DD'
   * @param {string} endDate - 'YYYY-MM-DD'
   */
  countLogsInRange(memberId, startDate, endDate) {
    return this.getAllLogs().filter(log => {
      if (String(log.member_id) !== String(memberId)) return false;
      const logDate = this.toDateString(log.workout_date);
      return logDate >= startDate && logDate <= endDate;
    }).length;
  },

  /**
   * Batch adds, updates, and deletes workout logs, then syncs the weekly count and note.
   *
   * @param {string} memberId
   * @param {number} year
   * @param {number} month
   * @param {number} weekNumber
   * @param {Array} logsToAdd - Array of log objects { workout_date, workout_type, duration_minutes }
   * @param {Array} logsToUpdate - Array of log objects { id, workout_date, workout_type, duration_minutes }
   * @param {Array} logIdsToDelete - Array of log UUIDs
   * @param {string} weeklyNote - Note for the specific week
   */
  batchSaveWorkoutLogs(memberId, year, month, weekNumber, logsToAdd, logsToUpdate, logIdsToDelete, weeklyNote) {
    // The weekly count is keyed by (year, month, week_number) while each log is keyed by its
    // own date. If a log lands outside the target week both keys drift apart: the log shows up
    // under a different week while this week's count is inflated. Reject it before writing.
    const week = (year && month && weekNumber) ? WorkoutWeekService.getWeek(year, month, weekNumber) : null;

    if (week) {
      const weekStart = this.toDateString(week.start_date);
      const weekEnd = this.toDateString(week.end_date);
      const outOfRange = (logsToAdd || []).concat(logsToUpdate || [])
        .map(log => this.toDateString(log.workout_date))
        .filter(logDate => logDate < weekStart || logDate > weekEnd);

      if (outOfRange.length > 0) {
        const unique = outOfRange.filter((d, i) => outOfRange.indexOf(d) === i);
        throw new Error(`[주차 범위 오류] ${month}월 ${weekNumber}주차(${weekStart} ~ ${weekEnd}) 범위를 벗어난 운동 날짜가 있습니다: ${unique.join(', ')}`);
      }
    }

    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    const workoutDateIndex = headers.indexOf('workout_date');
    const workoutTypeIndex = headers.indexOf('workout_type');
    const durationIndex = headers.indexOf('duration_minutes');

    // 1. Delete logs
    if (logIdsToDelete && logIdsToDelete.length > 0) {
      // Iterate backwards to avoid row index shifting
      for (let i = data.length - 1; i >= 1; i--) {
        if (logIdsToDelete.includes(data[i][idIndex])) {
          this.sheet.deleteRow(i + 1);
        }
      }
    }

    // 2. Update logs
    if (logsToUpdate && logsToUpdate.length > 0) {
      const updateMap = {};
      logsToUpdate.forEach(l => { updateMap[l.id] = l; });

      for (let i = 1; i < data.length; i++) {
        const logId = data[i][idIndex];
        if (updateMap[logId]) {
          const u = updateMap[logId];
          const rowIndex = i + 1;
          this.sheet.getRange(rowIndex, workoutDateIndex + 1).setValue(u.workout_date);
          this.sheet.getRange(rowIndex, workoutTypeIndex + 1).setValue(u.workout_type);
          this.sheet.getRange(rowIndex, durationIndex + 1).setValue(u.duration_minutes);
        }
      }
    }

    // 3. Add logs
    const createdLogs = [];
    if (logsToAdd && logsToAdd.length > 0) {
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

    // 4. Sync count and update note
    if (year && month && weekNumber) {
      // Get current record info (we need superPass, and count for the no-week fallback)
      const records = WorkoutService.getRecordsByWeek(year, month, weekNumber);
      const existing = records.find(r => r.member_id === memberId);
      const superPass = existing ? (existing.super_pass === true || existing.super_pass === 'TRUE' || existing.super_pass === 'true') : false;

      let newCount;
      if (week) {
        // Derive the count from the logs that actually fall inside the week rather than from a
        // running delta, so a count that has already drifted is repaired on the next save.
        SpreadsheetApp.flush();
        newCount = this.countLogsInRange(memberId, this.toDateString(week.start_date), this.toDateString(week.end_date));
      } else {
        // No week definition to anchor the range on: keep the previous delta behaviour.
        const netChange = (logsToAdd ? logsToAdd.length : 0) - (logIdsToDelete ? logIdsToDelete.length : 0);
        newCount = Math.max(0, (existing ? Number(existing.count) : 0) + netChange);
      }

      WorkoutService.updateWorkoutCount(memberId, year, month, weekNumber, newCount, superPass, weeklyNote);
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
