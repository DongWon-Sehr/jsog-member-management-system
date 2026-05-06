/**
 * Service for member management
 */
const MemberService = {
  /**
   * Retrieves the list of all members (including deactivated ones)
   */
  getAllMembers() {
    const sheet = Util.getSheet('member');
    if (!sheet) throw new Error('member sheet not found');
    return Util.sanitizeData(Util.sheetToObjects(sheet));
  },

  /**
   * Retrieves only active members
   */
  getActiveMembers() {
    const all = Util.sheetToObjects(Util.getSheet('member'));
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
   * Adds a new member
   */
  addMember(name, email) {
    const sheet = Util.getSheet('member');
    if (!sheet) throw new Error('member sheet not found');

    const newMember = {
      id: Util.generateUUID(),
      name: name,
      email: email || '',
      created_at: Util.getCurrentTimestamp(),
      updated_at: Util.getCurrentTimestamp(),
      enabled: true
    };

    // Create array matching the header order
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = headers.map(header => newMember[header] !== undefined ? newMember[header] : '');
    
    sheet.appendRow(rowData);
    return newMember;
  },

  /**
   * Updates an existing member's information (name, email)
   */
  updateMember(memberId, updateData) {
    const sheet = Util.getSheet('member');
    if (!sheet) throw new Error('member sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    const updatedAtIndex = headers.indexOf('updated_at');

    if (idIndex === -1) throw new Error('Required columns not found in member sheet');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === memberId) {
        const rowIndex = i + 1; // 1-based index
        
        // Update allowed fields
        if (updateData.name !== undefined) {
          sheet.getRange(rowIndex, headers.indexOf('name') + 1).setValue(updateData.name);
        }
        if (updateData.email !== undefined) {
          sheet.getRange(rowIndex, headers.indexOf('email') + 1).setValue(updateData.email);
        }
        
        // Always update timestamp
        sheet.getRange(rowIndex, updatedAtIndex + 1).setValue(Util.getCurrentTimestamp());
        return true;
      }
    }
    return false;
  },

  /**
   * Deactivates a member (Soft Delete)
   */
  deactivateMember(memberId) {
    const sheet = Util.getSheet('member');
    if (!sheet) throw new Error('member sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    const enabledIndex = headers.indexOf('enabled');
    const updatedAtIndex = headers.indexOf('updated_at');

    if (idIndex === -1 || enabledIndex === -1) throw new Error('Required columns not found in member sheet');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === memberId) {
        // rowIndex is i + 1 (1-based index)
        sheet.getRange(i + 1, enabledIndex + 1).setValue(false);
        sheet.getRange(i + 1, updatedAtIndex + 1).setValue(Util.getCurrentTimestamp());
        return true;
      }
    }
    return false;
  },

  /**
   * Reactivates a deactivated member
   */
  reactivateMember(memberId) {
    const sheet = Util.getSheet('member');
    if (!sheet) throw new Error('member sheet not found');

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');
    const enabledIndex = headers.indexOf('enabled');
    const updatedAtIndex = headers.indexOf('updated_at');

    if (idIndex === -1 || enabledIndex === -1) throw new Error('Required columns not found in member sheet');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === memberId) {
        sheet.getRange(i + 1, enabledIndex + 1).setValue(true);
        sheet.getRange(i + 1, updatedAtIndex + 1).setValue(Util.getCurrentTimestamp());
        return true;
      }
    }
    return false;
  }
};
