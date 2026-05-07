/**
 * Service for managing weekly workout counts
 */
const WorkoutService = {
  /**
   * Retrieves workout records for a specific year/month/week
   */
  getRecordsByWeek(year, month, weekNumber) {
    const sheet = Util.getSheet('workout_records');
    if (!sheet) throw new Error('workout_records sheet not found');

    const records = Util.sheetToObjects(sheet);
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
    const sheet = Util.getSheet('workout_records');
    if (!sheet) throw new Error('workout_records sheet not found');

    const data = sheet.getDataRange().getValues();
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
        sheet.getRange(rowIndex, idx.count + 1).setValue(record.count);
        sheet.getRange(rowIndex, idx.super_pass + 1).setValue(record.superPass);
        if (idx.note !== -1) {
          sheet.getRange(rowIndex, idx.note + 1).setValue(record.note);
        }
        sheet.getRange(rowIndex, idx.updated_at + 1).setValue(timestamp);
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
        sheet.appendRow(rowData);
      }
    });

    return true;
  },

  /**
   * Updates workout count (Upsert approach)
   */
  updateWorkoutCount(memberId, year, month, weekNumber, count, superPass = false, note = '') {
    const sheet = Util.getSheet('workout_records');
    if (!sheet) throw new Error('workout_records sheet not found');

    const data = sheet.getDataRange().getValues();
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
      sheet.getRange(foundRowIndex, idx.count + 1).setValue(count);
      sheet.getRange(foundRowIndex, idx.super_pass + 1).setValue(superPass);
      if (idx.note !== -1) {
        sheet.getRange(foundRowIndex, idx.note + 1).setValue(note);
      }
      sheet.getRange(foundRowIndex, idx.updated_at + 1).setValue(timestamp);
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
      sheet.appendRow(rowData);
    }
  }
};
