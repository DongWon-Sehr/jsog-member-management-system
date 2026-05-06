/**
 * Common utility functions
 */
const Util = {
  getSpreadsheet() {
    return SpreadsheetApp.getActiveSpreadsheet();
  },

  getSheet(sheetName) {
    return this.getSpreadsheet().getSheetByName(sheetName);
  },

  generateUUID() {
    return Utilities.getUuid();
  },

  getCurrentTimestamp() {
    const now = new Date();
    const pad = (n) => (n < 10 ? '0' + n : n);
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  },

  /**
   * Converts sheet data into an array of objects.
   */
  sheetToObjects(sheet) {
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0];
    return data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        obj[header] = row[index];
      });
      return obj;
    });
  },

  /**
   * Recursively sanitizes data for frontend transfer.
   * Converts Date objects to formatted strings.
   */
  sanitizeData(data) {
    if (data === null || data === undefined) return data;

    // Handle Arrays
    if (Array.isArray(data)) {
      return data.map(item => Util.sanitizeData(item));
    }

    // Handle Dates
    if (data instanceof Date) {
      const pad = (n) => (n < 10 ? '0' + n : n);
      return `${data.getFullYear()}-${pad(data.getMonth() + 1)}-${pad(data.getDate())} ` +
             `${pad(data.getHours())}:${pad(data.getMinutes())}:${pad(data.getSeconds())}`;
    }

    // Handle Objects
    if (typeof data === 'object') {
      const sanitized = {};
      for (const key in data) {
        sanitized[key] = Util.sanitizeData(data[key]);
      }
      return sanitized;
    }

    return data;
  }
};
