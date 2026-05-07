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
   * If tableName is provided, it uses MigrationService.SCHEMA to format dates exactly as typed.
   */
  sheetToObjects(sheet, tableName) {
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0];
    const schema = tableName && typeof MigrationService !== 'undefined' ? MigrationService.SCHEMA[tableName] : null;

    return data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        let value = row[index];
        
        // Strict Type Formatting based on Schema
        if (value instanceof Date && schema) {
          const colDef = schema.find(c => c.name === header);
          if (colDef) {
            const pad = (n) => (n < 10 ? '0' + n : n);
            const dateStr = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
            
            if (colDef.type === 'DATE') {
              value = dateStr;
            } else if (colDef.type === 'DATE_TIME') {
              value = `${dateStr} ${pad(value.getHours())}:${pad(value.getMinutes())}:${pad(value.getSeconds())}`;
            }
          }
        }
        
        obj[header] = value;
      });
      return obj;
    });
  },

  /**
   * Recursively sanitizes data for frontend transfer.
   * Date logic is now mostly handled by sheetToObjects + SCHEMA, 
   * but kept here as an ultimate safety net for unmapped data.
   */
  sanitizeData(data) {
    if (data === null || data === undefined) return data;

    // Handle Arrays
    if (Array.isArray(data)) {
      return data.map(item => Util.sanitizeData(item));
    }

    // Handle Dates (Fallback for non-sheet data)
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
