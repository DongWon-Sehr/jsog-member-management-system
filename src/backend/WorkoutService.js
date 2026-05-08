/**
 * Service for managing weekly workout counts
 */
const WorkoutService = {
  tableName: 'workout_records',
  
  get sheet() {
    if (!this._sheet) {
      this._sheet = Util.getSheet(this.tableName);
      if (!this._sheet) throw new Error(`${this.tableName} sheet not found`);
    }
    return this._sheet;
  },

  /**
   * Retrieves all workout records
   */
  getAllRecords() {
    const records = Util.sheetToObjects(this.sheet, this.tableName);
    return Util.sanitizeData(records);
  },

  /**
   * Retrieves workout records for a specific year/month/week
   */
  getRecordsByWeek(year, month, weekNumber) {
    const records = Util.sheetToObjects(this.sheet, this.tableName);
    const filtered = records.filter(record => 
      String(record.year) === String(year) && 
      String(record.month) === String(month) && 
      String(record.week_number) === String(weekNumber)
    );
    return Util.sanitizeData(filtered);
  },

  /**
   * Batch updates workout counts (Upsert approach)
   * @param {Array} recordsArray - Array of record objects
   */
  batchUpdateWorkoutCounts(recordsArray) {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];

    // Mapping indices
    const idx = {
      id: headers.indexOf('id'),
      member_id: headers.indexOf('member_id'),
      year: headers.indexOf('year'),
      month: headers.indexOf('month'),
      week_number: headers.indexOf('week_number'),
      count: headers.indexOf('count'),
      super_pass: headers.indexOf('super_pass'),
      note: headers.indexOf('note'),
      created_at: headers.indexOf('created_at'),
      updated_at: headers.indexOf('updated_at')
    };

    // Create a map to quickly find existing rows
    const existingMap = {};
    for (let i = 1; i < data.length; i++) {
      const key = `${data[i][idx.member_id]}_${data[i][idx.year]}_${data[i][idx.month]}_${data[i][idx.week_number]}`;
      existingMap[key] = i + 1;
    }

    const timestamp = Util.getCurrentTimestamp();

    recordsArray.forEach(record => {
      const key = `${record.memberId}_${record.year}_${record.month}_${record.weekNumber}`;
      const rowIndex = existingMap[key];

      if (rowIndex) {
        // Update existing record
        this.sheet.getRange(rowIndex, idx.count + 1).setValue(record.count);
        this.sheet.getRange(rowIndex, idx.super_pass + 1).setValue(record.superPass);
        if (idx.note !== -1) {
          this.sheet.getRange(rowIndex, idx.note + 1).setValue(record.note);
        }
        this.sheet.getRange(rowIndex, idx.updated_at + 1).setValue(timestamp);
      } else {
        // Insert new record
        const newRecord = {
          id: Util.generateUUID(),
          member_id: record.memberId,
          year: record.year,
          month: record.month,
          week_number: record.weekNumber,
          count: record.count,
          super_pass: record.superPass,
          note: record.note || '',
          created_at: timestamp,
          updated_at: timestamp
        };
        const rowData = headers.map(header => newRecord[header] !== undefined ? newRecord[header] : '');
        this.sheet.appendRow(rowData);
      }
    });

    return true;
  },

  /**
   * Updates workout count (Upsert approach)
   */
  updateWorkoutCount(memberId, year, month, weekNumber, count, superPass = false, note = '') {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];

    // Mapping indices
    const idx = {
      id: headers.indexOf('id'),
      member_id: headers.indexOf('member_id'),
      year: headers.indexOf('year'),
      month: headers.indexOf('month'),
      week_number: headers.indexOf('week_number'),
      count: headers.indexOf('count'),
      super_pass: headers.indexOf('super_pass'),
      note: headers.indexOf('note'),
      updated_at: headers.indexOf('updated_at')
    };

    let foundRowIndex = -1;

    // Find existing record
    for (let i = 1; i < data.length; i++) {
      if (
        data[i][idx.member_id] === memberId &&
        String(data[i][idx.year]) === String(year) &&
        String(data[i][idx.month]) === String(month) &&
        String(data[i][idx.week_number]) === String(weekNumber)
      ) {
        foundRowIndex = i + 1; // Sheets use 1-based index
        break;
      }
    }

    const timestamp = Util.getCurrentTimestamp();

    if (foundRowIndex > -1) {
      // Update existing record
      this.sheet.getRange(foundRowIndex, idx.count + 1).setValue(count);
      this.sheet.getRange(foundRowIndex, idx.super_pass + 1).setValue(superPass);
      if (idx.note !== -1) {
        this.sheet.getRange(foundRowIndex, idx.note + 1).setValue(note);
      }
      this.sheet.getRange(foundRowIndex, idx.updated_at + 1).setValue(timestamp);
    } else {
      // Insert new record
      const newRecord = {
        id: Util.generateUUID(),
        member_id: memberId,
        year: year,
        month: month,
        week_number: weekNumber,
        count: count,
        super_pass: superPass,
        note: note,
        created_at: timestamp,
        updated_at: timestamp
      };
      const rowData = headers.map(header => newRecord[header] !== undefined ? newRecord[header] : '');
      this.sheet.appendRow(rowData);
    }
  },

  /**
   * Increments or decrements the workout count for a member
   */
  incrementWorkoutCount(memberId, year, month, weekNumber, amount) {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];

    const idx = {
      member_id: headers.indexOf('member_id'),
      year: headers.indexOf('year'),
      month: headers.indexOf('month'),
      week_number: headers.indexOf('week_number'),
      count: headers.indexOf('count'),
      updated_at: headers.indexOf('updated_at')
    };

    let foundRowIndex = -1;
    let currentCount = 0;

    for (let i = 1; i < data.length; i++) {
      if (
        data[i][idx.member_id] === memberId &&
        String(data[i][idx.year]) === String(year) &&
        String(data[i][idx.month]) === String(month) &&
        String(data[i][idx.week_number]) === String(weekNumber)
      ) {
        foundRowIndex = i + 1;
        currentCount = Number(data[i][idx.count]) || 0;
        break;
      }
    }

    const timestamp = Util.getCurrentTimestamp();
    const newCount = Math.max(0, currentCount + amount);

    if (foundRowIndex > -1) {
      this.sheet.getRange(foundRowIndex, idx.count + 1).setValue(newCount);
      this.sheet.getRange(foundRowIndex, idx.updated_at + 1).setValue(timestamp);
    } else {
      // Insert new record with newCount
      this.updateWorkoutCount(memberId, year, month, weekNumber, newCount);
    }
    
    return newCount;
  }
};
