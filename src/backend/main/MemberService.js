/**
 * Service for member management
 */
const MemberService = {
  tableName: 'member',
  
  get sheet() {
    if (!this._sheet) {
      this._sheet = Util.getSheet(this.tableName);
      if (!this._sheet) throw new Error(`${this.tableName} sheet not found`);
    }
    return this._sheet;
  },

  /**
   * Retrieves the list of all members (including deactivated ones)
   */
  getAllMembers() {
    return Util.sanitizeData(Util.sheetToObjects(this.sheet, this.tableName));
  },

  /**
   * Retrieves only active members
   */
  getActiveMembers() {
    const all = Util.sheetToObjects(this.sheet, this.tableName);
    const active = all.filter(member => member.enabled === true || member.enabled === 'TRUE' || member.enabled === 'true');
    return Util.sanitizeData(active);
  },

  /**
   * Retrieves a specific member by ID
   */
  getMemberById(memberId) {
    return this.getAllMembers().find(member => member.id === memberId) || null;
  },

  /**
   * Retrieves a member by Kakao Plus ID
   */
  getMemberByKakaoId(kakaoId) {
    if (!kakaoId) return null;
    return this.getAllMembers().find(member => member.kakao_plus_id === kakaoId) || null;
  },

  /**
   * Retrieves a member by exact Email
   */
  getMemberByEmail(email) {
    if (!email) return null;
    const searchEmail = String(email).trim().toLowerCase();
    return this.getAllMembers().find(member => member.email.toLowerCase() === searchEmail) || null;
  },

  /**
   * Smart Search: Retrieves a member by Name (emoji-safe) or Email
   */
  getMemberByName(input) {
    if (!input) return null;
    const cleanInput = String(input).trim();

    if (cleanInput.includes('@')) {
      return this.getMemberByEmail(cleanInput);
    }

    const allMembers = this.getAllMembers();
    
    // Strip everything except Korean, English, and numbers
    const purify = (str) => String(str).replace(/[^\wㄱ-힣]/g, '').trim();
    const target = purify(cleanInput);
    if (!target) return null;

    const matches = allMembers.filter(member => {
      const dbNameClean = purify(member.name);
      return dbNameClean === target || dbNameClean.includes(target);
    });

    return matches.length > 0 ? matches[0] : null;
  },

  /**
   * Adds a new member
   */
  addMember(name, email, extra) {
    const details = extra || {};
    const newMember = {
      id: Util.generateUUID(),
      name: name,
      email: email || '',
      kakao_plus_id: '',
      created_at: Util.getCurrentTimestamp(),
      updated_at: Util.getCurrentTimestamp(),
      enabled: true,
      joined_at: details.joined_at || Util.toDateString(new Date()),
      bank_type: details.bank_type || '',
      bank_account: details.bank_account || ''
    };

    const headers = this.sheet.getRange(1, 1, 1, this.sheet.getLastColumn()).getValues()[0];
    const rowData = headers.map(header => newMember[header] !== undefined ? newMember[header] : '');
    
    this.sheet.appendRow(rowData);
    return newMember;
  },

  /**
   * Updates an existing member's information (name, email, kakao_plus_id, joined_at, bank details)
   */
  updateMember(memberId, updateData) {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    const updatedAtIndex = headers.indexOf('updated_at');

    if (idIndex === -1) throw new Error(`Required columns not found in ${this.tableName} sheet`);

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === memberId) {
        const rowIndex = i + 1;
        
        if (updateData.name !== undefined) {
          this.sheet.getRange(rowIndex, headers.indexOf('name') + 1).setValue(updateData.name);
        }
        if (updateData.email !== undefined) {
          this.sheet.getRange(rowIndex, headers.indexOf('email') + 1).setValue(updateData.email);
        }
        if (updateData.kakao_plus_id !== undefined) {
          this.sheet.getRange(rowIndex, headers.indexOf('kakao_plus_id') + 1).setValue(updateData.kakao_plus_id);
        }
        ['joined_at', 'bank_type', 'bank_account'].forEach(field => {
          if (updateData[field] === undefined) return;
          const columnIndex = headers.indexOf(field);
          if (columnIndex === -1) {
            console.warn(`[MemberService] '${field}' column is missing - run run_setupDatabase(). Value not saved.`);
            return;
          }
          this.sheet.getRange(rowIndex, columnIndex + 1).setValue(updateData[field]);
        });
        if (updateData.enabled !== undefined) {
          const enabledVal = updateData.enabled === true || String(updateData.enabled).toUpperCase() === 'TRUE' || String(updateData.enabled) === 'true';
          this.sheet.getRange(rowIndex, headers.indexOf('enabled') + 1).setValue(enabledVal);
        }
        
        this.sheet.getRange(rowIndex, updatedAtIndex + 1).setValue(Util.getCurrentTimestamp());
        return true;
      }
    }
    return false;
  },

  /**
   * Deactivates a member (Soft Delete)
   */
  deactivateMember(memberId) {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    const enabledIndex = headers.indexOf('enabled');
    const updatedAtIndex = headers.indexOf('updated_at');

    if (idIndex === -1 || enabledIndex === -1) throw new Error(`Required columns not found in ${this.tableName} sheet`);

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === memberId) {
        this.sheet.getRange(i + 1, enabledIndex + 1).setValue(false);
        this.sheet.getRange(i + 1, updatedAtIndex + 1).setValue(Util.getCurrentTimestamp());
        return true;
      }
    }
    return false;
  },

  /**
   * Reactivates a deactivated member
   */
  reactivateMember(memberId) {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    const enabledIndex = headers.indexOf('enabled');
    const updatedAtIndex = headers.indexOf('updated_at');

    if (idIndex === -1 || enabledIndex === -1) throw new Error(`Required columns not found in ${this.tableName} sheet`);

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === memberId) {
        this.sheet.getRange(i + 1, enabledIndex + 1).setValue(true);
        this.sheet.getRange(i + 1, updatedAtIndex + 1).setValue(Util.getCurrentTimestamp());
        return true;
      }
    }
    return false;
  }
};
