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
   * Converts sheet data into an array of objects based on schema definition.
   */
  sheetToObjects(sheet, tableName) {
    const data = sheet.getDataRange().getValues();
    if (data.length <= 1) return [];

    const headers = data[0];
    const schema = MigrationService.SCHEMA[tableName] || [];
    const schemaMap = {};
    schema.forEach(col => { schemaMap[col.name] = col.type; });

    return data.slice(1).map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        let value = row[index];
        const type = schemaMap[header];

        if (value instanceof Date) {
          const y = value.getFullYear();
          const m = String(value.getMonth() + 1).padStart(2, '0');
          const d = String(value.getDate()).padStart(2, '0');
          
          if (type === 'DATE') {
            value = `${y}-${m}-${d}`;
          } else {
            // Default to DATE_TIME or if type is unknown but it's a Date object
            const hh = String(value.getHours()).padStart(2, '0');
            const mm = String(value.getMinutes()).padStart(2, '0');
            const ss = String(value.getSeconds()).padStart(2, '0');
            value = `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
          }
        }
        
        obj[header] = Util.sanitizeData(value);
      });
      return obj;
    });
  },

  /**
   * Recursively sanitizes data for frontend transfer.
   * Ensures all basic Date objects (not caught by schema) are still converted.
   */
  sanitizeData(data) {
    if (data === null || data === undefined) return data;

    // Handle Arrays
    if (Array.isArray(data)) {
      return data.map(item => Util.sanitizeData(item));
    }

    // Handle Dates (Fallback for objects/arrays not coming directly from sheetToObjects)
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
