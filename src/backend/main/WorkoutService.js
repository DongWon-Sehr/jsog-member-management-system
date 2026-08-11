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

    const existingMap = {};
    for (let i = 1; i < data.length; i++) {
      const key = `${data[i][idx.member_id]}_${data[i][idx.year]}_${data[i][idx.month]}_${data[i][idx.week_number]}`;
      existingMap[key] = i + 1;
    }

    // Super pass rule: only one per member per month
    const allRecords = Util.sheetToObjects(this.sheet, this.tableName);
    const superPassUsage = {};

    for (const record of recordsArray) {
      if (record.superPass === true || String(record.superPass).toUpperCase() === 'TRUE') {
        const usageKey = `${record.memberId}_${record.year}_${record.month}`;
        
        const alreadyUsedDb = allRecords.find(r => 
          r.member_id === record.memberId &&
          String(r.year) === String(record.year) &&
          String(r.month) === String(record.month) &&
          String(r.week_number) !== String(record.weekNumber) &&
          (r.super_pass === true || String(r.super_pass).toUpperCase() === 'TRUE')
        );

        if (alreadyUsedDb) {
          const memberName = MemberService.getMemberById(record.memberId)?.name || record.memberId;
          throw new Error(`[슈퍼패스 정책 위반] ${memberName} 멤버는 이미 ${record.month}-${alreadyUsedDb.week_number}주차에 슈퍼패스를 사용했습니다.`);
        } else if (superPassUsage[usageKey]) {
          const memberName = MemberService.getMemberById(record.memberId)?.name || record.memberId;
          throw new Error(`[슈퍼패스 정책 위반] ${memberName} 멤버는 이미 저장 목록 내 동일한 월(${record.month}월)에 슈퍼패스 사용 요청이 포함되어 있습니다.`);
        }
        superPassUsage[usageKey] = true;
      }
    }

    const timestamp = Util.getCurrentTimestamp();

    recordsArray.forEach(record => {
      const key = `${record.memberId}_${record.year}_${record.month}_${record.weekNumber}`;
      const rowIndex = existingMap[key];

      if (rowIndex) {
        this.sheet.getRange(rowIndex, idx.count + 1).setValue(record.count);
        this.sheet.getRange(rowIndex, idx.super_pass + 1).setValue(record.superPass);
        if (idx.note !== -1) {
          this.sheet.getRange(rowIndex, idx.note + 1).setValue(record.note);
        }
        this.sheet.getRange(rowIndex, idx.updated_at + 1).setValue(timestamp);
      } else {
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

    // Super pass rule: only one per member per month
    if (superPass === true || String(superPass).toUpperCase() === 'TRUE') {
      const allRecords = Util.sheetToObjects(this.sheet, this.tableName);
      const alreadyUsed = allRecords.find(r => 
        r.member_id === memberId &&
        String(r.year) === String(year) &&
        String(r.month) === String(month) &&
        String(r.week_number) !== String(weekNumber) &&
        (r.super_pass === true || String(r.super_pass).toUpperCase() === 'TRUE')
      );
      if (alreadyUsed) {
        const memberName = MemberService.getMemberById(memberId)?.name || memberId;
        throw new Error(`[슈퍼패스 정책 위반] ${memberName} 멤버는 이미 ${month}-${alreadyUsed.week_number}주차에 슈퍼패스를 사용했습니다.`);
      }
    }

    let foundRowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      if (
        data[i][idx.member_id] === memberId &&
        String(data[i][idx.year]) === String(year) &&
        String(data[i][idx.month]) === String(month) &&
        String(data[i][idx.week_number]) === String(weekNumber)
      ) {
        foundRowIndex = i + 1;
        break;
      }
    }

    const timestamp = Util.getCurrentTimestamp();

    if (foundRowIndex > -1) {
      this.sheet.getRange(foundRowIndex, idx.count + 1).setValue(count);
      this.sheet.getRange(foundRowIndex, idx.super_pass + 1).setValue(superPass);
      if (idx.note !== -1) {
        this.sheet.getRange(foundRowIndex, idx.note + 1).setValue(note);
      }
      this.sheet.getRange(foundRowIndex, idx.updated_at + 1).setValue(timestamp);
    } else {
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
      this.updateWorkoutCount(memberId, year, month, weekNumber, newCount);
    }
    
    return newCount;
  }
};
