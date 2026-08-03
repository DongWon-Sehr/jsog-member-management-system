/**
 * Legacy Data Migration Scripts
 * This file contains one-off scripts to import existing data into the system.
 */

function run_setupDatabase() {
  console.log("=== run_setupDatabase Start ===");
  MigrationService.setup();
  console.log("Database tables and columns setup complete.");
  console.log("=== run_setupDatabase End ===");
}

function run_migrateOldMembers() {
  return; // Backup mode: disabled to prevent accidental duplicates
  console.log("=== run_migrateOldMembers Start ===");
  
  const legacyMembers = [
    "🐟동원", "🌿재연", "😃소희", "🐶혜운", "🐹지영", "👻찬미", 
    "🥳주현", "🍒채린", "🌴현주", "😃유림", "😃영철", "🎧누리", 
    "🫛수완", "🧚🏻‍♀️수희", "🐧진구", "🐰가은", "🍷찬준"
  ];

  // The members who should be disabled (enabled: 0/false)
  const disabledKeywords = ["소희", "주현", "영철", "가은"];

  let addedCount = 0;
  let updatedCount = 0;
  let deactivatedCount = 0;

  const existingMembers = MemberService.getAllMembers();

  legacyMembers.forEach(name => {
    let memberId;
    const existing = existingMembers.find(m => m.name === name);
    
    if (existing) {
      // Overwrite (update) existing member
      MemberService.updateMember(existing.id, { name: name });
      memberId = existing.id;
      updatedCount++;
      console.log(`Updated: ${name}`);
    } else {
      // Add new member
      const newMember = MemberService.addMember(name, "");
      memberId = newMember.id;
      addedCount++;
      console.log(`Added: ${name}`);
    }
    
    // Check if they should be deactivated
    const shouldDeactivate = disabledKeywords.some(keyword => name.includes(keyword));
    
    if (shouldDeactivate) {
      MemberService.deactivateMember(memberId);
      deactivatedCount++;
      console.log(`DEACTIVATED: ${name}`);
    } else {
      // If it's an existing member that was deactivated but shouldn't be, reactivate them
      if (existing && (existing.enabled === false || existing.enabled === 'FALSE' || existing.enabled === 'false')) {
         MemberService.reactivateMember(memberId);
         console.log(`REACTIVATED: ${name}`);
      }
    }
  });

  console.log(`Migration Complete: Added ${addedCount}, Updated ${updatedCount}, Deactivated ${deactivatedCount} members.`);
  console.log("=== run_migrateOldMembers End ===");
}

function run_migrateWorkoutRecords2024() {
  return; // Backup mode: disabled to prevent accidental duplicates
  console.log("=== run_migrateWorkoutRecords2024 Start (Batch Mode) ===");
  
  const rawData = `기간	🐟동원	🌿재연	😃소희	🐰가은	🐶혜운	🐹지영	👻찬미	🥳주현	🍒채린	🌴현주	😃유림
01/29 ~ 02/04	4	3	0	3							
02/05 ~ 02/11	3	3	2	4							
02/12 ~ 02/18	5	3	3	3							
02/19 ~ 02/25	3	2	0	2							
02/26 ~ 03/03	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간				
03/04 ~ 03/10	부상 이슈 (휴식)	0	0	3							
03/11 ~ 03/17	부상 이슈 (휴식)	3	0	3							
03/18 ~ 03/24	부상 이슈 (휴식)	4	0	4							
03/25 ~ 03/31	부상 이슈 (휴식)	1	0	4							
04/01 ~ 04/07	2	3	2	감기 이슈 (휴식)							
04/08 ~ 04/14	2	2	1	3							
04/15 ~ 04/21	2	0	0	3							
04/22 ~ 04/28	5	3	3	3							
2024-1 정산	26	27	11	35							
04/29 ~ 05/05	4	4	2	1							
05/06 ~ 05/12	4	1	2	본가 이슈 (휴식)							
05/13 ~ 05/19	4	1	3	3							
05/20 ~ 05/26	6	3	2	4							
05/27 ~ 06/02	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간				
06/03 ~ 06/09	2	1	0	3	6	4					
06/10 ~ 06/16	3	3	0	5	3	4					
06/17 ~ 06/23	3	3	1	6	3	4					
06/24 ~ 06/30	4	1	0	감기 이슈 (휴식)	5	6	4				
07/01 ~ 07/07	4	2	3	4	5	4	4				
07/08 ~ 07/14	3	부상 이슈 (휴식)	3	5	3	4	3				
07/15 ~ 07/21	2	3	0	4	4	3	3				
07/22 ~ 07/28	4	3	2	3	5	4	4				
2024-2 정산	43	25	18	38	34	33	18				
07/29 ~ 08/04	3	2	2	3	8	6	4				
08/05 ~ 08/11	4	3	2	3	8	3	6	5	4		
08/12 ~ 08/18	4	2	1	3	5	3	6	5	4		
08/19 ~ 08/25	4	4	4	4	6	5	4	5	5		
08/26 ~ 09/01	2	3	0	3	5	6	6	3	3		
09/02 ~ 09/08	5	3	1	5	4	3	4	5	6		
09/09 ~ 09/15	6	3	3	3	1	4	5	5	6		
09/16 ~ 09/22	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간		
09/23 ~ 09/29	4	6	1	7	5	7	8	5	5		
09/30 ~ 10/06	3	5	2	5	4	5	6	3	3		
10/07 ~ 10/13	2	3	2	3	1	3	6	6	3	3	
10/14 ~ 10/20	3	4	0	3	3	5	5	3	4	3	
10/21 ~ 10/27	3	3	0	3	4	7	5	4	3	1	5
2024-3 정산	43	41	18	45	54	57	65	49	46	7	5
10/28 ~ 11/03	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간
11/04 ~ 11/10	4	3	0	5	3	6	3	3	3	1	3
11/11 ~ 11/17	4	3	0	3	6	6	0	3	3	3	4
11/18 ~ 11/24	2	3	0	5	3	6	2	3	5	3	2
11/25 ~ 12/01	3	2	0	0	6	8	1	3	6	1	3
12/02 ~ 12/08	3	4	0	5	0	3	부상 이슈 (휴식)	1	3	3	3
12/09 ~ 12/15	4	3	갓생 이슈 (휴식)	3	1	6	부상 이슈 (휴식)	0	4	4	3
12/16 ~ 12/22	3	1	갓생 이슈 (휴식)	3	갓생 이슈 (휴식)	4	3	3	4	1	3
12/23 ~ 12/29	3	3	1	3	갓생 이슈 (휴식)	5	3	3	3	3	3
12/30 ~ 01/05	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간
2024-4 정산	26	22	1	27	19	44	12	19	31	19	24`;

  const lines = rawData.trim().split('\n');
  if (lines.length < 2) return;

  const headerCells = lines[0].split('\t').map(h => h.trim());
  const memberNames = headerCells.slice(1); // Exclude the "기간" column
  
  const allMembers = MemberService.getAllMembers();
  // Create a map to quickly find member IDs by name
  const memberMap = {};
  memberNames.forEach(name => {
    if (!name) return;
    const member = allMembers.find(m => m.name === name);
    if (member) {
      memberMap[name] = member.id;
    } else {
      console.error(`Member not found in DB: ${name}. Skipping their records.`);
    }
  });

  const sheet = Util.getSheet('workout_records');
  if (!sheet) throw new Error('workout_records sheet not found');
  
  const sheetHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRowsData = [];

  let currentYear = 2024;
  let currentMonth = 2; // Start from February
  let weekNumber = 1;   // Start from Week 1

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = line.split('\t').map(c => c.trim());
    const period = cells[0];

    // Skip settlement summary rows
    if (period.includes('정산')) {
      continue;
    }

    // Determine if it's a global skip week
    const isGlobalSkipWeek = period.includes('보너스 휴식 주간') || cells.some(c => c === '보너스 휴식 주간');
    
    // If it's a skip week, skip the entire row. No records are created, week counter does not increment.
    if (isGlobalSkipWeek) {
      continue;
    }

    for (let j = 1; j < cells.length; j++) {
      const cellValue = cells[j];
      const memberName = memberNames[j - 1];
      const memberId = memberMap[memberName];

      if (!memberId || cellValue === '') continue; // Skip empty cells or unknown members

      let count = 0;
      let note = '';
      
      // Parse cell value
      if (cellValue.includes('휴식 주간') || cellValue.includes('휴식')) {
        count = 0; 
        note = cellValue; // Capture the reason (e.g., 'Injury Issue (Rest)')
      } else {
        count = parseInt(cellValue, 10);
        if (isNaN(count)) {
          count = 0;
          note = cellValue;
        }
      }

      const timestamp = Util.getCurrentTimestamp();
      
      // Construct row object mapping
      const newRecord = {
        id: Util.generateUUID(),
        member_id: memberId,
        year: currentYear,
        month: currentMonth,
        week_number: weekNumber,
        count: count,
        super_pass: false, // Default false for migration
        note: note,
        created_at: timestamp,
        updated_at: timestamp
      };

      // Map to array based on header order
      const rowArray = sheetHeaders.map(header => newRecord[header] !== undefined ? newRecord[header] : '');
      newRowsData.push(rowArray);
    }
    
    // Increment week. Every 4 weeks, roll over to the next month.
    weekNumber++; 
    if (weekNumber > 4) {
      weekNumber = 1;
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
  }

  // Batch insert all records at once for high performance
  if (newRowsData.length > 0) {
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, newRowsData.length, sheetHeaders.length).setValues(newRowsData);
  }

  console.log(`Migration Complete: Batch inserted ${newRowsData.length} workout records for year 2024. Finished at Month ${currentMonth} Week ${weekNumber}.`);
  console.log("=== run_migrateWorkoutRecords2024 End ===");
}

function run_migrateWorkoutRecords2025() {
  return; // Backup mode: disabled to prevent accidental duplicates
  console.log("=== run_migrateWorkoutRecords2025 Start (Batch Mode) ===");
  
  const rawData = `기간	🐟동원	🌿재연	😃소희	🐶혜운	🐹지영	👻찬미	🥳주현	🍒채린	🌴현주	😃유림	😃영철	🎧누리	🫛수완	🧚🏻‍♀️수희
12/30 ~ 01/05	6	3	1	5	6	5	4	5	1	3				
01/06 ~ 01/12	3	3	1	4	5	3	2	7	휴식 (독감이슈)	3	3			
01/13 ~ 01/19	6	3	0	4	8	휴식 (발목부상)	3	7	3	3	3			
01/20 ~ 01/26	4	3	0	3	7	휴식 (발목부상)	3	6	3	3	2			
01/27 ~ 02/02	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간			
02/03 ~ 02/09	3	3	1	2	11	3	3	3	3	3	3			
02/10 ~ 02/16	3	3	1	5	9	3	3	3	1	3	3			
02/17 ~ 02/23	3	4	3	4	6	3	2	5	2	4	3			
02/24 ~ 03/02	2	3	1	휴식 (부상이슈)	4	3	3	5	3	4	0			
03/03 ~ 03/09	5	4	휴식 (야근이슈)	4	6	3	3	3	3	5	3			
03/10 ~ 03/16	3	3	휴식 (야근이슈)	3	5	6	3	7	2	3	3			
03/17 ~ 03/23	4	4	0	4	3	4	3	3	3	4	2			
03/24 ~ 03/30	3	3	0	3	4	5	1	6	2	4	휴식 (해외출장)			
2025-1 정산	45	39	8	41	74	38	33	60	26	42	25			
03/31 ~ 04/06	3	4	휴식 (야근이슈)	3	1	4	0	4	2	3	3			
04/07 ~ 04/13	3	3	0	3	5	3	4	5	3	3	3			
04/14 ~ 04/20	5	5	0	3	5	4	3	3	3	4	1			
04/21 ~ 04/27	3	6	0	3	4	5	3	7	1	4	3			
04/28 ~ 05/04	1	4	0	3	3	4	3	7	4	5	1			
05/05 ~ 05/11	4	5	0	1	1	5	3	3	3	4	3			
05/12 ~ 05/18	3	4	0	7	4	3	2	6	3	3	4			
05/19 ~ 05/25	3	5	0	5	4	4	3	6	3	3	3			
05/26 ~ 06/01	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간			
06/02 ~ 06/08	3	5		4	4	6	3	6	3	4	3			
06/09 ~ 06/15	4	4		3	4	5	3	6	3	3	3			
06/16 ~ 06/22	4	3		2	휴식 (발목부상)	1	3	4	3	3	3			
06/23 ~ 06/29	3	3		휴식 (코로나)	휴식 (발목부상)	3	3	4	1	3	1			
2025-2 정산	39	51	0	37	35	47	33	61	32	42	31			
06/30 ~ 07/06	3	4		3	3	6	3	4	3	3	1			
07/07 ~ 07/13	3	2		4	1	4	4	3	1	3	1			
07/14 ~ 07/20	2	4		1	4	4	3	3	2	1	3			
07/21 ~ 07/27	3	3		5	6	4	4	5	3	3	3			
07/28 ~ 08/03	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간			
08/04 ~ 08/10	4	3		1	5		3	3	3	3	1			
08/11 ~ 08/17	2	4		3	5		1	3	3	2	1			
08/18 ~ 08/24	3	4		3	4		3	3	3	휴식 (목부상)	3			
08/25 ~ 08/31	0	4		5	2		3	4	5	휴식 (목부상)	3			
09/01 ~ 09/07	3	3		3	3		0	4	3	3	2			
09/08 ~ 09/14	1	4		5	5		0	2	2	3	2			
09/15 ~ 09/21	2	1		1	5		3	3	4	3	3			
09/22 ~ 09/28	3	3		4	4		0	3	4	2	1			
2025-3 정산	29	39	0	38	47	18	27	40	36	26	24			
09/29 ~ 10/05	1	2		0	2		0	3	1	3	1			
10/06 ~ 10/12	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간		
10/13 ~ 10/19	1	3		3	6		0	3	1	3	0	3		
10/20 ~ 10/26	3	5		6	3		3	1	3	3	1	3		
10/27 ~ 11/02	0	2		5	1		4	0	2	3	0	4		
11/03 ~ 11/09	3	3		6	1		4	4	1	1	1	4		
11/10 ~ 11/16	3	3		5	4		4	3	5	3	1	3		
11/17 ~ 11/23	3	2		6	3		3	3	2	3	3	3	3	
11/24 ~ 11/30	2	3		4	1		3	0	3	3	3	3	4	
12/01 ~ 12/07	3	3		3	1		3	4	3	1	1	3	2	3
12/08 ~ 12/14	2	1		6	1		1	3	3	3	0	1	2	4
12/15 ~ 12/21	3	1		3	0		0	1	3	3	1	3	3	4
12/22 ~ 12/28	4	0		5	0		0	0	2	3	3	2	2	4
12/29 ~ 01/04	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간
2025-4 정산	28	28	0	52	23	0	25	25	29	32	15	32	16	15`;

  const lines = rawData.trim().split('\n');
  if (lines.length < 2) return;

  const headerCells = lines[0].split('\t').map(h => h.trim());
  const memberNames = headerCells.slice(1);
  
  const allMembers = MemberService.getAllMembers();
  const memberMap = {};
  memberNames.forEach(name => {
    if (!name) return;
    const member = allMembers.find(m => m.name === name);
    if (member) {
      memberMap[name] = member.id;
    } else {
      console.error(`Member not found in DB: ${name}.`);
    }
  });

  const sheet = Util.getSheet('workout_records');
  if (!sheet) throw new Error('workout_records sheet not found');
  const sheetHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRowsData = [];

  let currentYear = 2025;
  let currentMonth = 1; // Start from January
  let weekNumber = 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = line.split('\t').map(c => c.trim());
    const period = cells[0];

    if (period.includes('정산')) continue;

    const isGlobalSkipWeek = period.includes('보너스 휴식 주간') || cells.some(c => c === '보너스 휴식 주간');
    if (isGlobalSkipWeek) continue;

    for (let j = 1; j < cells.length; j++) {
      const cellValue = cells[j];
      const memberName = memberNames[j - 1];
      const memberId = memberMap[memberName];

      if (!memberId || cellValue === '') continue;

      let count = 0;
      let note = '';
      
      if (cellValue.includes('휴식')) {
        count = 0;
        note = cellValue;
      } else {
        count = parseInt(cellValue, 10);
        if (isNaN(count)) {
          count = 0;
          note = cellValue;
        }
      }

      const timestamp = Util.getCurrentTimestamp();
      const newRecord = {
        id: Util.generateUUID(),
        member_id: memberId,
        year: currentYear,
        month: currentMonth,
        week_number: weekNumber,
        count: count,
        super_pass: false, 
        note: note,
        created_at: timestamp,
        updated_at: timestamp
      };

      const rowArray = sheetHeaders.map(header => newRecord[header] !== undefined ? newRecord[header] : '');
      newRowsData.push(rowArray);
    }
    
    // Cycle logic: 4 weeks per month
    weekNumber++; 
    if (weekNumber > 4) {
      weekNumber = 1;
      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }
  }

  if (newRowsData.length > 0) {
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 1, 1, newRowsData.length, sheetHeaders.length).setValues(newRowsData);
  }

  console.log(`Migration Complete: Batch inserted ${newRowsData.length} records for 2025. Ended at ${currentYear}-${currentMonth}-${weekNumber}`);
  console.log("=== run_migrateWorkoutRecords2025 End ===");
}

function run_migrateWorkoutRecords2026() {
  // ... (existing run_migrateWorkoutRecords2026 content)
}

/**
 * @deprecated Dedupes on (year, month, week_number), which is no longer the identity of a week -
 * a week is identified by its start_date. Worse, it keeps the *first* occurrence, so on a
 * renumbered week it deletes the corrected row and keeps the stale one.
 * Use run_migrateWorkoutWeeksRestFlag() / run_applyWorkoutWeeksRestFlagMigration() instead.
 */
function run_removeDuplicateWorkoutWeeks() {
  console.warn('[Deprecated] run_removeDuplicateWorkoutWeeks dedupes on the wrong key. Use run_applyWorkoutWeeksRestFlagMigration() instead.');
  return;
  console.log("=== run_removeDuplicateWorkoutWeeks Start ===");
  const sheet = Util.getSheet('workout_weeks');
  if (!sheet) {
    console.error("Sheet 'workout_weeks' not found.");
    return;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    console.log("No data found to process.");
    return;
  }

  const headers = data[0];
  const yearIdx = headers.indexOf('year');
  const monthIdx = headers.indexOf('month');
  const weekNumIdx = headers.indexOf('week_number');

  if (yearIdx === -1 || monthIdx === -1 || weekNumIdx === -1) {
    console.error("Required columns (year, month, week_number) not found.");
    return;
  }

  const seenKeys = new Set();
  const rowsToDelete = [];

  // Iterate from the second row (index 1) to the end
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const key = `${row[yearIdx]}-${row[monthIdx]}-${row[weekNumIdx]}`;
    
    if (seenKeys.has(key)) {
      // It's a duplicate. Mark the row number (1-based) for deletion.
      rowsToDelete.push(i + 1);
    } else {
      seenKeys.add(key);
    }
  }

  if (rowsToDelete.length === 0) {
    console.log("No duplicate workout weeks found.");
  } else {
    console.log(`Found ${rowsToDelete.length} duplicate rows. Deleting...`);
    
    // Delete rows from bottom to top to avoid shifting indexes
    for (let j = rowsToDelete.length - 1; j >= 0; j--) {
      const rowIndex = rowsToDelete[j];
      sheet.deleteRow(rowIndex);
      console.log(`Deleted row ${rowIndex}`);
    }
    
    console.log(`Success: Removed ${rowsToDelete.length} duplicate workout weeks.`);
  }
  
  console.log("=== run_removeDuplicateWorkoutWeeks End ===");
}

/**
 * Repairs workout_records.count values that drifted away from the actual workout_logs rows.
 *
 * A count could previously be applied to the week the modal was opened for even when the log
 * itself was dated in another week, leaving one week inflated and the other short. This
 * recomputes every count from the logs.
 *
 * Scope: every week starting on or after `fromDate`. Weeks before it are left untouched because
 * their counts are imported history with no logs behind them - recomputing those would zero them.
 * `fromDate` defaults to the start of the earliest week that contains a log.
 *
 * Note this must include in-scope weeks that hold *no* logs: a week inflated by a log that was
 * actually dated in another week ends up with zero logs of its own, and that is exactly the row
 * that needs to be reset to 0.
 *
 * Run `run_recalculateWorkoutCounts` first to review the report, then
 * `run_applyRecalculatedWorkoutCounts` to write the changes.
 *
 * @param {string} [fromDate] - Optional 'YYYY-MM-DD' lower bound on the weeks to recalculate
 */
function run_recalculateWorkoutCounts(fromDate) {
  _recalculateWorkoutCounts(false, fromDate);
}

function run_applyRecalculatedWorkoutCounts(fromDate) {
  _recalculateWorkoutCounts(true, fromDate);
}

function _recalculateWorkoutCounts(apply, fromDate) {
  const mode = apply ? 'APPLY' : 'DRY-RUN';
  console.log(`=== _recalculateWorkoutCounts Start (${mode}) ===`);

  const sheet = Util.getSheet('workout_records');
  if (!sheet) {
    console.error("Sheet 'workout_records' not found.");
    return;
  }

  const weeks = WorkoutWeekService.getAllWeeks();
  const logs = WorkoutLogService.getAllLogs();
  const toDateString = value => WorkoutLogService.toDateString(value);

  // Tally logs into the week that actually contains their date.
  const tally = {};        // composite key -> { memberId, year, month, weekNumber, count }
  const weeksWithLogs = {}; // 'year_month_week' -> true
  let orphanLogs = 0;

  logs.forEach(log => {
    const logDate = toDateString(log.workout_date);
    const week = weeks.find(w => logDate >= toDateString(w.start_date) && logDate <= toDateString(w.end_date));

    if (!week) {
      orphanLogs++;
      console.warn(`No week covers ${logDate} (log ${log.id}) - ignored`);
      return;
    }

    const weekKey = `${week.year}_${week.month}_${week.week_number}`;
    weeksWithLogs[weekKey] = true;

    const key = `${weekKey}|${log.member_id}`;
    if (!tally[key]) {
      tally[key] = { memberId: log.member_id, year: week.year, month: week.month, weekNumber: week.week_number, count: 0 };
    }
    tally[key].count++;
  });

  // Determine which weeks are log-managed (and therefore safe to recompute to their true count,
  // including down to 0). Everything before the boundary is treated as imported history.
  let boundary = fromDate ? toDateString(fromDate) : null;
  if (!boundary) {
    weeks.forEach(week => {
      if (!weeksWithLogs[`${week.year}_${week.month}_${week.week_number}`]) return;
      const start = toDateString(week.start_date);
      if (!boundary || start < boundary) boundary = start;
    });
  }

  if (!boundary) {
    console.log('No logs found in workout_logs - nothing to recalculate.');
    console.log(`=== _recalculateWorkoutCounts End (${mode}) ===`);
    return;
  }

  const inScope = {};
  let skippedWeeks = 0;
  weeks.forEach(week => {
    if (toDateString(week.start_date) >= boundary) inScope[`${week.year}_${week.month}_${week.week_number}`] = true;
    else skippedWeeks++;
  });

  console.log(`Scope: weeks starting on or after ${boundary} (${fromDate ? 'explicit fromDate' : 'earliest week containing a log'}). ${skippedWeeks} earlier week(s) left untouched.`);

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const idx = {
    member_id: headers.indexOf('member_id'),
    year: headers.indexOf('year'),
    month: headers.indexOf('month'),
    week_number: headers.indexOf('week_number'),
    count: headers.indexOf('count'),
    updated_at: headers.indexOf('updated_at')
  };

  const timestamp = Util.getCurrentTimestamp();
  const seen = {};
  let fixed = 0;

  for (let i = 1; i < data.length; i++) {
    const weekKey = `${data[i][idx.year]}_${data[i][idx.month]}_${data[i][idx.week_number]}`;
    const key = `${weekKey}|${data[i][idx.member_id]}`;
    seen[key] = true;

    // Out-of-scope weeks hold imported history; recomputing them would wipe the counts.
    if (!inScope[weekKey]) continue;

    const expected = tally[key] ? tally[key].count : 0;
    const current = Number(data[i][idx.count]) || 0;
    if (expected === current) continue;

    console.log(`${apply ? 'Fixing' : 'Would fix'} ${key}: ${current} -> ${expected}`);
    if (apply) {
      sheet.getRange(i + 1, idx.count + 1).setValue(expected);
      sheet.getRange(i + 1, idx.updated_at + 1).setValue(timestamp);
    }
    fixed++;
  }

  // Members with logs in a week but no record row yet.
  let created = 0;
  Object.keys(tally).forEach(key => {
    if (seen[key]) return;
    const t = tally[key];
    if (!inScope[`${t.year}_${t.month}_${t.weekNumber}`]) return;
    console.log(`${apply ? 'Creating' : 'Would create'} ${key}: count ${t.count}`);
    if (apply) {
      WorkoutService.updateWorkoutCount(t.memberId, t.year, t.month, t.weekNumber, t.count, false, '');
    }
    created++;
  });

  console.log(`${mode} complete: ${fixed} rows ${apply ? 'fixed' : 'to fix'}, ${created} rows ${apply ? 'created' : 'to create'}, ${orphanLogs} logs outside any configured week.`);
  if (!apply) console.log('Run run_applyRecalculatedWorkoutCounts() to write these changes.');
  console.log(`=== _recalculateWorkoutCounts End (${mode}) ===`);
}

/**
 * Migrates workout_weeks onto the is_rest_week schema. Dry run - reports only.
 *
 * Run run_applyWorkoutWeeksRestFlagMigration() to write the changes.
 */
function run_migrateWorkoutWeeksRestFlag() {
  _migrateWorkoutWeeksRestFlag(false);
}

/**
 * Applies the workout_weeks is_rest_week migration.
 *
 * Steps:
 *  1. MigrationService.setup() appends the is_rest_week column to the existing sheet
 *  2. Rows sharing a start_date are collapsed - these are duplicates left behind by the old
 *     (year, month, week_number) upsert, which appended a new row whenever a week was renumbered
 *     instead of updating the existing one. The most recently created row wins, because that is
 *     the one the admin saved last.
 *  3. is_rest_week is backfilled from the legacy encoding (week_number === 0 meant "rest week").
 *     Only empty cells are filled, so re-running is safe: once the planner starts preserving a
 *     rest week's number, week_number no longer implies anything about rest status.
 *
 * workout_records are deliberately left alone. No week is renumbered here, so every existing
 * (year, month, week_number) join keeps pointing at the same week.
 */
function run_applyWorkoutWeeksRestFlagMigration() {
  _migrateWorkoutWeeksRestFlag(true);
}

/**
 * Sortable timestamp for a created_at cell, which may be a Date, a string, or empty
 */
function _weekCreatedAtValue(value) {
  if (value instanceof Date) return value.getTime();
  const parsed = Date.parse(String(value || '').replace(' ', 'T'));
  return isNaN(parsed) ? 0 : parsed;
}

function _migrateWorkoutWeeksRestFlag(apply) {
  const mode = apply ? 'APPLY' : 'DRY RUN';
  console.log(`=== _migrateWorkoutWeeksRestFlag Start (${mode}) ===`);

  if (apply) {
    // Appends is_rest_week to the existing sheet when it is missing
    MigrationService.setup();
  }

  const sheet = Util.getSheet('workout_weeks');
  if (!sheet) {
    console.error("Sheet 'workout_weeks' not found.");
    return;
  }

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    console.log('No data found to process.');
    console.log(`=== _migrateWorkoutWeeksRestFlag End (${mode}) ===`);
    return;
  }

  const headers = data[0];
  const startIdx = headers.indexOf('start_date');
  const weekIdx = headers.indexOf('week_number');
  const yearIdx = headers.indexOf('year');
  const monthIdx = headers.indexOf('month');
  const createdIdx = headers.indexOf('created_at');

  if (startIdx === -1 || weekIdx === -1 || yearIdx === -1 || monthIdx === -1) {
    console.error('Required columns (year, month, week_number, start_date) not found.');
    return;
  }

  const isBlankRow = row => row.every(cell => cell === '' || cell === null);
  const describe = row => `${row[yearIdx]}-${row[monthIdx]}-${row[weekIdx]}`;

  // --- Step 1: collapse rows that share a start_date ---
  const groupsByStart = {};
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (isBlankRow(row)) continue;

    const startDate = Util.toDateString(row[startIdx]);
    if (!startDate) {
      console.warn(`Row ${i + 1}: no start_date, left untouched.`);
      continue;
    }
    if (!groupsByStart[startDate]) groupsByStart[startDate] = [];
    groupsByStart[startDate].push({ rowNumber: i + 1, row: row });
  }

  const rowsToDelete = [];
  Object.keys(groupsByStart).sort().forEach(startDate => {
    const group = groupsByStart[startDate];
    if (group.length === 1) return;

    const ordered = group.slice().sort((a, b) => {
      const timeA = createdIdx === -1 ? 0 : _weekCreatedAtValue(a.row[createdIdx]);
      const timeB = createdIdx === -1 ? 0 : _weekCreatedAtValue(b.row[createdIdx]);
      if (timeA !== timeB) return timeA - timeB;
      return a.rowNumber - b.rowNumber;
    });

    const keeper = ordered[ordered.length - 1];
    ordered.slice(0, -1).forEach(duplicate => {
      console.log(`${apply ? 'Deleting' : 'Would delete'} duplicate for ${startDate}: row ${duplicate.rowNumber} (${describe(duplicate.row)}) - keeping row ${keeper.rowNumber} (${describe(keeper.row)})`);
      rowsToDelete.push(duplicate.rowNumber);
    });
  });

  if (apply && rowsToDelete.length > 0) {
    // Bottom-up so earlier row numbers stay valid
    rowsToDelete.sort((a, b) => b - a).forEach(rowNumber => sheet.deleteRow(rowNumber));
  }
  console.log(`Duplicates: ${rowsToDelete.length} row(s) ${apply ? 'deleted' : 'to delete'}.`);

  // --- Step 2: backfill is_rest_week ---
  const refreshed = sheet.getDataRange().getValues();
  const restIdx = refreshed[0].indexOf('is_rest_week');

  if (restIdx === -1) {
    console.log("'is_rest_week' column not present yet - the apply run adds it via MigrationService.setup().");
  } else if (refreshed.length > 1) {
    const column = [];
    let filledRest = 0;
    let filledWorkout = 0;
    let alreadySet = 0;

    for (let i = 1; i < refreshed.length; i++) {
      const row = refreshed[i];
      if (isBlankRow(row)) {
        column.push(['']);
        continue;
      }

      const current = row[restIdx];
      if (current !== '' && current !== null && current !== undefined) {
        // Already migrated. Never recompute from week_number: a migrated rest week keeps the
        // number the admin assigned, so week_number no longer encodes rest status.
        column.push([Util.toBoolean(current)]);
        alreadySet++;
        continue;
      }

      const isRest = Number(row[weekIdx]) === 0;
      column.push([isRest]);
      if (isRest) filledRest++; else filledWorkout++;
    }

    if (apply) {
      sheet.getRange(2, restIdx + 1, column.length, 1).setValues(column);
    }
    console.log(`is_rest_week: ${filledRest} rest + ${filledWorkout} workout week(s) ${apply ? 'backfilled' : 'to backfill'}, ${alreadySet} already set.`);
  }

  // --- Step 3: report label collisions the planner will now refuse to save ---
  const finalData = sheet.getDataRange().getValues();
  const finalRestIdx = finalData[0].indexOf('is_rest_week');
  const seenLabels = {};
  let collisions = 0;

  for (let i = 1; i < finalData.length; i++) {
    const row = finalData[i];
    if (isBlankRow(row)) continue;

    const isRest = finalRestIdx === -1
      ? Number(row[weekIdx]) === 0
      : Util.toBoolean(row[finalRestIdx]);
    if (isRest) continue;

    const label = describe(row);
    if (seenLabels[label]) {
      console.warn(`Label collision: ${label} is used by ${seenLabels[label]} and ${Util.toDateString(row[startIdx])}. Fix it in the planner - saving is blocked until it is unique.`);
      collisions++;
    } else {
      seenLabels[label] = Util.toDateString(row[startIdx]);
    }
  }
  console.log(`Label check: ${collisions} colliding (year, month, week_number) label(s) among workout weeks.`);

  if (!apply) console.log('Run run_applyWorkoutWeeksRestFlagMigration() to write these changes.');
  console.log(`=== _migrateWorkoutWeeksRestFlag End (${mode}) ===`);
}
