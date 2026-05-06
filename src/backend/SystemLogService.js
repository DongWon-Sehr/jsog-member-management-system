/**
 * Service for system logging and error tracking (e.g., Chatbot webhook events)
 */
const SystemLogService = {
  /**
   * Adds a new log entry
   * 
   * @param {string} action - The name of the action or event type (e.g., 'WEBHOOK_RECEIVED', 'ERROR')
   * @param {string|object} details - Detailed information. Objects will be stringified.
   */
  addLog(action, details) {
    const sheet = Util.getSheet('logs');
    if (!sheet) return; // Fail silently if logs sheet doesn't exist

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
    const sheet = Util.getSheet('logs');
    if (!sheet) throw new Error('logs sheet not found');

    const logs = Util.sheetToObjects(sheet);
    // Sort by timestamp descending and take the top `limit`
    return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, limit);
  }
};
