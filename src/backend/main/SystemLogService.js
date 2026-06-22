/**
 * Service for system logging and error tracking (e.g., Chatbot webhook events)
 */
const SystemLogService = {
  tableName: 'logs',
  
  get sheet() {
    if (!this._sheet) {
      this._sheet = Util.getSheet(this.tableName);
      if (!this._sheet) throw new Error(`${this.tableName} sheet not found`);
    }
    return this._sheet;
  },

  /**
   * Adds a new log entry
   * 
   * @param {string} action - The name of the action or event type (e.g., 'WEBHOOK_RECEIVED', 'ERROR')
   * @param {string|object} details - Detailed information. Objects will be stringified.
   */
  addLog(action, details) {
    // Fail silently if logs sheet doesn't exist to prevent crashing main flows
    let sheet;
    try {
      sheet = this.sheet;
    } catch (e) {
      return; 
    }

    const detailsStr = typeof details === 'object' ? JSON.stringify(details) : String(details);

    const newLog = {
      id: Util.generateUUID(),
      timestamp: Util.getCurrentTimestamp(),
      action: action,
      details: detailsStr
    };

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = headers.map(header => newLog[header] !== undefined ? newLog[header] : '');
    
    sheet.appendRow(rowData);
    return newLog;
  },

  /**
   * Retrieves recent logs
   * @param {number} limit - Maximum number of logs to retrieve (default: 50)
   */
  getRecentLogs(limit = 50) {
    const logs = Util.sheetToObjects(this.sheet, this.tableName);
    // Sort by timestamp descending and take the top `limit`
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }
};
