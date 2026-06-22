/**
 * Service for database (sheet) initialization and migration management
 * Utilizes Google Sheets Advanced API to create structured "Tables" with column types.
 */
const MigrationService = {
  SCHEMA: {
    member: [
      { name: 'id', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'kakao_plus_id', type: 'TEXT' },
      { name: 'created_at', type: 'DATE_TIME' },
      { name: 'updated_at', type: 'DATE_TIME' },
      { name: 'enabled', type: 'BOOLEAN' }
    ],
    workout_records: [
      { name: 'id', type: 'TEXT' },
      { name: 'member_id', type: 'TEXT' },
      { name: 'year', type: 'DOUBLE' },
      { name: 'month', type: 'DOUBLE' },
      { name: 'week_number', type: 'DOUBLE' },
      { name: 'count', type: 'DOUBLE' },
      { name: 'super_pass', type: 'BOOLEAN' },
      { name: 'note', type: 'TEXT' },
      { name: 'created_at', type: 'DATE_TIME' },
      { name: 'updated_at', type: 'DATE_TIME' }
    ],
    workout_logs: [
      { name: 'id', type: 'TEXT' },
      { name: 'member_id', type: 'TEXT' },
      { name: 'workout_date', type: 'DATE_TIME' },
      { name: 'workout_type', type: 'TEXT' },
      { name: 'duration_minutes', type: 'DOUBLE' },
      { name: 'created_at', type: 'DATE_TIME' }
    ],
    rewards_log: [
      { name: 'id', type: 'TEXT' },
      { name: 'member_id', type: 'TEXT' },
      { name: 'reward_date', type: 'TEXT' },
      { name: 'amount', type: 'DOUBLE' },
      { name: 'description', type: 'TEXT' },
      { name: 'created_at', type: 'DATE_TIME' }
    ],
    logs: [
      { name: 'id', type: 'TEXT' },
      { name: 'timestamp', type: 'DATE_TIME' },
      { name: 'action', type: 'TEXT' },
      { name: 'details', type: 'TEXT' }
    ],
    workout_weeks: [
      { name: 'id', type: 'TEXT' },
      { name: 'year', type: 'DOUBLE' },
      { name: 'month', type: 'DOUBLE' },
      { name: 'week_number', type: 'DOUBLE' },
      { name: 'start_date', type: 'DATE' },
      { name: 'end_date', type: 'DATE' },
      { name: 'created_at', type: 'DATE_TIME' }
    ]
  },

  /**
   * Sets up sheets and required columns as Native Tables.
   */
  setup() {
    const ss = Util.getSpreadsheet();

    // 2. Initialize member table
    this._ensureTable(ss, 'member', this.SCHEMA.member);

    // 2. Initialize workout_records table
    this._ensureTable(ss, 'workout_records', this.SCHEMA.workout_records);

    // 3. Initialize workout_logs table
    this._ensureTable(ss, 'workout_logs', this.SCHEMA.workout_logs);

    // 4. Initialize rewards_log table
    this._ensureTable(ss, 'rewards_log', this.SCHEMA.rewards_log);

    // 5. Initialize logs table
    this._ensureTable(ss, 'logs', this.SCHEMA.logs);

    // 6. Initialize workout_weeks table
    this._ensureTable(ss, 'workout_weeks', this.SCHEMA.workout_weeks);
  },

  /**
   * Creates a sheet and converts it into a structured Table via Sheets API if it's new.
   */
  _ensureTable(ss, sheetName, columnsConfig) {
    let sheet = ss.getSheetByName(sheetName);
    const requiredColumnNames = columnsConfig.map(col => col.name);
    
    // If sheet doesn't exist, create it and make it a Table
    if (!sheet) {
      console.log(`[Migration] Creating new sheet: '${sheetName}'`);
      sheet = ss.insertSheet(sheetName);
      sheet.appendRow(requiredColumnNames);
      
      const sheetId = sheet.getSheetId();
      const maxRows = sheet.getMaxRows();
      
      const columnProperties = columnsConfig.map((col, index) => {
        return {
          columnIndex: index,
          columnName: col.name,
          columnType: col.type
        };
      });

      // Try to create the table using the exact sheetName
      const resource = {
        requests: [
          {
            addTable: {
              table: {
                name: sheetName, // Use exact name as requested
                range: {
                  sheetId: sheetId,
                  startRowIndex: 0,
                  endRowIndex: maxRows,
                  startColumnIndex: 0,
                  endColumnIndex: columnsConfig.length
                },
                columnProperties: columnProperties
              }
            }
          }
        ]
      };

      try {
        Sheets.Spreadsheets.batchUpdate(resource, ss.getId());
        console.log(`[Migration] Successfully converted '${sheetName}' into a Native Table.`);
      } catch (e) {
        console.error(`[Migration] Error creating Table for '${sheetName}': ${e.message}`);
      }

      // Post-creation cleanup: Clean up extra rows safely
      try {
        // 1. Freeze the header row
        sheet.setFrozenRows(1);
        
        const currentMaxRows = sheet.getMaxRows();
        if (currentMaxRows > 1) {
          // 2. Clear all content and formatting from row 2 onwards
          sheet.getRange(2, 1, currentMaxRows - 1, sheet.getLastColumn()).clear();
          
          // 3. Delete extra rows to leave only row 1 (header) and row 2 (clean data row)
          if (currentMaxRows > 2) {
            sheet.deleteRows(3, currentMaxRows - 2);
          }
          console.log(`[Migration] Cleaned up and cleared all rows for '${sheetName}'. Table is now ready for fresh data.`);
        }
      } catch (cleanupError) {
        console.warn(`[Migration] Warning: Could not clean up rows for '${sheetName}': ${cleanupError.message}`);
      }
      return;
    }

    // If sheet exists, check headers and append missing columns
    const lastCol = sheet.getLastColumn();
    
    if (lastCol === 0) {
      console.log(`[Migration] Sheet '${sheetName}' is empty. Appending headers: ${requiredColumnNames.join(', ')}`);
      sheet.appendRow(requiredColumnNames);
      return;
    }

    const headerRange = sheet.getRange(1, 1, 1, lastCol);
    const existingColumns = headerRange.getValues()[0];
    const missingColumns = requiredColumnNames.filter(col => !existingColumns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`[Migration] Appending new columns to existing sheet '${sheetName}': ${missingColumns.join(', ')}`);
      const startCol = existingColumns.length + 1;
      sheet.getRange(1, startCol, 1, missingColumns.length).setValues([missingColumns]);
    } else {
      console.log(`[Migration] Skipped '${sheetName}': All required columns already exist.`);
    }
  }
};
