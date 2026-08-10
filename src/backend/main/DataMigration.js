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

function run_importChatHistory() {
  _importChatHistory(false);
}

function run_applyChatHistoryImport() {
  _importChatHistory(true);
}

function _hangulOnly(name) {
  return String(name === null || name === undefined ? '' : name).replace(/[^가-힣]/g, '');
}

function _importChatHistory(apply) {
  const mode = apply ? 'APPLY' : 'DRY RUN';
  console.log(`=== _importChatHistory Start (${mode}) ===`);

  if (typeof CHAT_IMPORT_WEEKS === 'undefined' || !CHAT_IMPORT_WEEKS.length) {
    console.error('CHAT_IMPORT_WEEKS is empty. Regenerate it with: node scripts/parse-kakao-chat.js');
    return;
  }

  const weeksSheet = Util.getSheet('workout_weeks');
  const recordsSheet = Util.getSheet('workout_records');
  const logsSheet = Util.getSheet('workout_logs');
  const rewardsSheet = Util.getSheet('rewards_log');
  if (!weeksSheet) throw new Error('workout_weeks sheet not found');
  if (!recordsSheet) throw new Error('workout_records sheet not found');
  if (!logsSheet) throw new Error('workout_logs sheet not found');
  if (!rewardsSheet) throw new Error('rewards_log sheet not found');

  const membersByName = {};
  MemberService.getAllMembers().forEach(member => {
    const key = _hangulOnly(member.name);
    if (!key) return;
    if (membersByName[key]) {
      console.warn(`Two members share the short name '${key}': '${membersByName[key].name}' and '${member.name}'. Their records are skipped.`);
      membersByName[key] = null;
      return;
    }
    membersByName[key] = member;
  });

  const unknownNames = {};

  const weekHeaders = weeksSheet.getRange(1, 1, 1, weeksSheet.getLastColumn()).getValues()[0];
  const existingWeeks = {};
  const claimedLabels = {};

  WorkoutWeekService.getAllWeeks().forEach(week => {
    const startDate = Util.toDateString(week.start_date);
    if (!startDate) return;
    existingWeeks[startDate] = week;
    if (!week.is_rest_week && Util.hasWeekNumber(week.week_number)) {
      claimedLabels[`${week.year}-${week.month}-${week.week_number}`] = startDate;
    }
  });

  const recordHeaders = recordsSheet.getRange(1, 1, 1, recordsSheet.getLastColumn()).getValues()[0];
  const existingRecords = {};
  Util.sheetToObjects(recordsSheet, 'workout_records').forEach(record => {
    existingRecords[`${record.member_id}|${record.year}-${record.month}-${record.week_number}`] =
      Number(record.count);
  });

  const logHeaders = logsSheet.getRange(1, 1, 1, logsSheet.getLastColumn()).getValues()[0];
  const existingLogDates = {};
  Util.sheetToObjects(logsSheet, 'workout_logs').forEach(log => {
    existingLogDates[`${log.member_id}|${Util.toDateString(log.workout_date)}`] = true;
  });

  const timestamp = Util.getCurrentTimestamp();
  const newWeekRows = [];
  const newRecordRows = [];
  const newLogRows = [];
  let weeksSkipped = 0;
  let recordsSkipped = 0;
  let weeksBlocked = 0;
  let logsSkipped = 0;
  let logsPadded = 0;
  let logsDropped = 0;

  CHAT_IMPORT_WEEKS.forEach(week => {
    const startDate = week.start_date;
    const existing = existingWeeks[startDate];
    let label = null;

    if (existing) {
      weeksSkipped++;
      if (!existing.is_rest_week && Util.hasWeekNumber(existing.week_number)) {
        label = { year: Number(existing.year), month: Number(existing.month), weekNumber: Number(existing.week_number) };
      } else {
        console.log(`${startDate}: already in the sheet as a rest week / unnumbered week - records skipped.`);
      }
    } else if (week.is_rest_week) {
      newWeekRows.push({ year: week.year, month: week.month, week_number: 0, start_date: startDate, end_date: week.end_date, is_rest_week: true });
      console.log(`${startDate}: ${apply ? 'adding' : 'would add'} rest week (${week.year}-${week.month}).`);
    } else {
      const labelKey = `${week.year}-${week.month}-${week.week_number}`;
      if (!Util.hasWeekNumber(week.week_number)) {
        console.warn(`${startDate}: the chat never labelled this week (${labelKey}). Add it in the planner by hand - skipped.`);
        weeksBlocked++;
        return;
      }
      if (claimedLabels[labelKey]) {
        console.warn(`${startDate}: label ${labelKey} is already used by ${claimedLabels[labelKey]}. Fix the numbering in the planner - skipped.`);
        weeksBlocked++;
        return;
      }
      claimedLabels[labelKey] = startDate;
      newWeekRows.push({ year: week.year, month: week.month, week_number: week.week_number, start_date: startDate, end_date: week.end_date, is_rest_week: false });
      label = { year: week.year, month: week.month, weekNumber: week.week_number };
      console.log(`${startDate}: ${apply ? 'adding' : 'would add'} week ${labelKey} (${week.records.length} record(s) from ${week.postings} posting(s)).`);
    }

    if (!label) return;

    week.records.forEach(record => {
      const member = membersByName[_hangulOnly(record.name)];
      if (!member) {
        unknownNames[record.name] = (unknownNames[record.name] || 0) + 1;
        return;
      }

      const key = `${member.id}|${label.year}-${label.month}-${label.weekNumber}`;
      const alreadyThere = existingRecords[key] !== undefined;

      if (alreadyThere) {
        recordsSkipped++;
      } else {
        existingRecords[key] = record.count;
        newRecordRows.push({
          id: Util.generateUUID(),
          member_id: member.id,
          year: label.year,
          month: label.month,
          week_number: label.weekNumber,
          count: record.count,
          super_pass: record.super_pass,
          note: record.note,
          created_at: timestamp,
          updated_at: timestamp
        });
        console.log(`  ${startDate} ${member.name}: ${apply ? 'adding' : 'would add'} count ${record.count}${record.super_pass ? ' (슈퍼패스)' : ''}${record.note ? ` "${record.note}"` : ''}`);
      }

      const span = _datesInSpan(startDate, week.end_date);

      const hasLogs = span.some(date => existingLogDates[`${member.id}|${date}`]);
      if (hasLogs) {
        logsSkipped += (week.logs || []).filter(log => log.name === record.name).length;
        return;
      }

      const chatLogs = (week.logs || []).filter(log => log.name === record.name);
      const logs = _fitLogsToCount(
        chatLogs,
        Number(existingRecords[key]) || 0,
        span,
        `${startDate} ${member.name}`,
        apply
      );
      if (logs.length > chatLogs.length) logsPadded += logs.length - chatLogs.length;
      if (logs.length < chatLogs.length) logsDropped += chatLogs.length - logs.length;
      if (logs.length === 0) return;

      logs.forEach(log => {
        existingLogDates[`${member.id}|${Util.toDateString(log.workout_date)}`] = true;
        newLogRows.push({
          id: Util.generateUUID(),
          member_id: member.id,
          workout_date: log.workout_date,
          workout_type: log.workout_type,
          duration_minutes: log.duration_minutes,
          created_at: timestamp
        });
      });
    });
  });

  const newJoinDates = [];
  let joinDatesSkipped = 0;

  (typeof CHAT_IMPORT_MEMBERS === 'undefined' ? [] : CHAT_IMPORT_MEMBERS).forEach(entry => {
    const member = membersByName[_hangulOnly(entry.name)];
    if (!member) {
      unknownNames[entry.name] = (unknownNames[entry.name] || 0) + 1;
      return;
    }

    const current = Util.toDateString(member.joined_at);
    if (current) {
      joinDatesSkipped++;
      return;
    }

    newJoinDates.push({ id: member.id, name: member.name, joined_at: entry.joined_at });
    console.log(`  ${member.name}: ${apply ? 'setting' : 'would set'} joined_at ${entry.joined_at}`);
  });

  const rewardHeaders = rewardsSheet.getRange(1, 1, 1, rewardsSheet.getLastColumn()).getValues()[0];
  const existingRewards = {};
  Util.sheetToObjects(rewardsSheet, 'rewards_log').forEach(reward => {
    existingRewards[`${reward.member_id}|${reward.reward_date}`] = true;
  });

  const newRewardRows = [];
  let rewardsSkipped = 0;

  (typeof CHAT_IMPORT_REWARDS === 'undefined' ? [] : CHAT_IMPORT_REWARDS).forEach(reward => {
    const member = membersByName[_hangulOnly(reward.name)];
    if (!member) {
      unknownNames[reward.name] = (unknownNames[reward.name] || 0) + 1;
      return;
    }

    const key = `${member.id}|${reward.reward_date}`;
    if (existingRewards[key]) {
      rewardsSkipped++;
      return;
    }
    existingRewards[key] = true;

    newRewardRows.push({
      id: Util.generateUUID(),
      member_id: member.id,
      reward_date: reward.reward_date,
      amount: reward.amount,
      description: reward.description,
      created_at: timestamp
    });
    console.log(`  ${reward.reward_date} ${member.name}: ${apply ? 'adding' : 'would add'} reward - ${reward.description} (금액 미상)`);
  });

  Object.keys(unknownNames).forEach(name => {
    console.warn(`No member matches the chat name '${name}' (${unknownNames[name]} record(s) skipped). Register them first if their history matters.`);
  });

  if (apply) {
    if (newWeekRows.length > 0) {
      const rows = newWeekRows.map(week => weekHeaders.map(header => {
        if (header === 'id') return Util.generateUUID();
        if (header === 'created_at') return timestamp;
        return week[header] !== undefined ? week[header] : '';
      }));
      weeksSheet.getRange(weeksSheet.getLastRow() + 1, 1, rows.length, weekHeaders.length).setValues(rows);
      _sortRows(weeksSheet, weekHeaders, ['start_date']);
    }

    if (newRecordRows.length > 0) {
      const rows = newRecordRows.map(record => recordHeaders.map(header => record[header] !== undefined ? record[header] : ''));
      recordsSheet.getRange(recordsSheet.getLastRow() + 1, 1, rows.length, recordHeaders.length).setValues(rows);
      _sortRows(recordsSheet, recordHeaders, ['year', 'month', 'week_number', 'member_id']);
    }

    if (newLogRows.length > 0) {
      const rows = newLogRows.map(log => logHeaders.map(header => log[header] !== undefined ? log[header] : ''));
      logsSheet.getRange(logsSheet.getLastRow() + 1, 1, rows.length, logHeaders.length).setValues(rows);
      _sortRows(logsSheet, logHeaders, ['workout_date', 'member_id']);
    }

    newJoinDates.forEach(entry => {
      MemberService.updateMember(entry.id, { joined_at: entry.joined_at });
    });

    if (newRewardRows.length > 0) {
      const rows = newRewardRows.map(reward => rewardHeaders.map(header => reward[header] !== undefined ? reward[header] : ''));
      rewardsSheet.getRange(rewardsSheet.getLastRow() + 1, 1, rows.length, rewardHeaders.length).setValues(rows);
      _sortRows(rewardsSheet, rewardHeaders, ['reward_date', 'member_id']);
    }
  }

  const unknownLogs = newLogRows.filter(log => log.workout_type === CHAT_IMPORT_UNKNOWN_TYPE).length;

  console.log('--------------------------------------------------');
  console.log(`Weeks:   ${newWeekRows.length} ${apply ? 'added' : 'to add'}, ${weeksSkipped} already in the sheet, ${weeksBlocked} blocked.`);
  console.log(`Records: ${newRecordRows.length} ${apply ? 'added' : 'to add'}, ${recordsSkipped} already in the sheet.`);
  console.log(`Logs:    ${newLogRows.length} ${apply ? 'added' : 'to add'} (${unknownLogs} ${CHAT_IMPORT_UNKNOWN_TYPE}), ${logsSkipped} already logged.`);
  console.log(`         fitted to the sheet's counts: ${logsPadded} padded, ${logsDropped} dropped.`);
  console.log(`Members: ${newJoinDates.length} joined_at ${apply ? 'set' : 'to set'}, ${joinDatesSkipped} already had one.`);
  console.log(`Rewards: ${newRewardRows.length} ${apply ? 'added' : 'to add'} with no amount (fill them in from the reward tab), ${rewardsSkipped} already in the sheet.`);
  if (!apply) console.log('Nothing was written. Run run_applyChatHistoryImport() to write these changes.');
  console.log(`=== _importChatHistory End (${mode}) ===`);
}

function run_migrateRewardsLogTypes() {
  _migrateRewardsLogTypes(false);
}

function run_applyRewardsLogTypesMigration() {
  _migrateRewardsLogTypes(true);
}

function _migrateRewardsLogTypes(apply) {
  const mode = apply ? 'APPLY' : 'DRY RUN';
  console.log(`=== _migrateRewardsLogTypes Start (${mode}) ===`);

  const sheet = Util.getSheet('rewards_log');
  if (!sheet) {
    console.error("Sheet 'rewards_log' not found.");
    return;
  }

  const data = sheet.getDataRange().getValues();
  const headers = data[0];

  const columns = [
    { name: 'reward_date', type: 'DATE', parse: _parseRewardDate, expects: 'a date' },
    { name: 'amount', type: 'CURRENCY', parse: _parseAmount, expects: 'a number' }
  ];

  const plans = [];
  const problems = [];

  columns.forEach(column => {
    const index = headers.indexOf(column.name);
    if (index === -1) {
      console.warn(`'${column.name}' column not found - skipped.`);
      return;
    }

    const values = [];
    let converted = 0;

    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row.every(cell => cell === '' || cell === null)) {
        values.push(['']);
        continue;
      }

      const value = row[index];
      const result = column.parse(value);
      if (result === null) {
        problems.push(`${column.name} row ${i + 1}: '${value}' is not ${column.expects}.`);
        values.push([value]);
        continue;
      }
      if (result.changed) converted++;
      values.push([result.value]);
    }

    plans.push({ column: column, index: index, values: values, converted: converted });
    console.log(`${column.name} → ${column.type}: ${values.length} row(s), ${converted} value(s) ${apply ? 'rewritten' : 'to rewrite'}.`);
  });

  if (problems.length > 0) {
    console.error(`${problems.length} value(s) cannot be converted. Fix them in the reward tab, then run this again:`);
    problems.forEach(entry => console.error(`  ${entry}`));
    console.log('Nothing was changed.');
    console.log(`=== _migrateRewardsLogTypes End (${mode}) ===`);
    return;
  }

  if (apply) {
    _setTableColumnTypes(sheet, plans.map(plan => ({ name: plan.column.name, type: plan.column.type })));
    SpreadsheetApp.flush();

    plans.forEach(plan => {
      if (plan.values.length === 0) return;
      sheet.getRange(2, plan.index + 1, plan.values.length, 1).setValues(plan.values);
    });
  } else {
    console.log('Run run_applyRewardsLogTypesMigration() to write these changes.');
  }

  console.log(`=== _migrateRewardsLogTypes End (${mode}) ===`);
}

function _parseAmount(value) {
  if (value === '' || value === null || value === undefined) return { value: '', changed: false };
  if (typeof value === 'number') return { value: value, changed: false };

  const text = String(value).replace(/[₩,\s]/g, '');
  if (!/^-?\d+(\.\d+)?$/.test(text)) return null;
  return { value: Number(text), changed: true };
}

function _parseRewardDate(value) {
  if (value === '' || value === null || value === undefined) return { value: '', changed: false };
  if (Object.prototype.toString.call(value) === '[object Date]') return { value: value, changed: false };

  const text = String(value).trim();

  let match = /^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/.exec(text);
  let date = match ? _asDate(match[1], match[2], match[3]) : null;

  if (!date) {
    match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(text);
    date = match ? _asDate(match[3], match[1], match[2]) : null;
  }

  return date ? { value: date, changed: true } : null;
}

function _asDate(year, month, day) {
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  const valid = date.getFullYear() === Number(year)
    && date.getMonth() === Number(month) - 1
    && date.getDate() === Number(day);
  return valid ? date : null;
}

function _setTableColumnTypes(sheet, changes) {
  const spreadsheet = Util.getSpreadsheet();

  try {
    const meta = Sheets.Spreadsheets.get(spreadsheet.getId(), { fields: 'sheets(properties(sheetId),tables)' });
    const target = (meta.sheets || []).find(entry => entry.properties.sheetId === sheet.getSheetId());
    const table = target && target.tables && target.tables[0];

    if (!table) {
      console.log(`'${sheet.getName()}' is not a native Table - the values were converted, no column type to update.`);
      return;
    }

    const columns = (table.columnProperties || []).map(column => {
      const change = changes.find(entry => entry.name === column.columnName);
      if (!change) return column;
      return { columnIndex: column.columnIndex, columnName: column.columnName, columnType: change.type };
    });

    Sheets.Spreadsheets.batchUpdate({
      requests: [{
        updateTable: {
          table: { tableId: table.tableId, columnProperties: columns },
          fields: 'columnProperties'
        }
      }]
    }, spreadsheet.getId());
    changes.forEach(change => console.log(`Table column '${change.name}' is now ${change.type}.`));
  } catch (e) {
    console.warn(`Could not update the Table column types on '${sheet.getName()}': ${e.message}. The values were converted; set the column types by hand if they still read as text.`);
  }
}

function _fitLogsToCount(logs, count, span, label, apply) {
  if (logs.length === count) return logs;

  if (count === 0) {
    console.log(`  ${label}: sheet count is 0 - ${logs.length} chat log(s) dropped.`);
    return [];
  }

  if (logs.length > count) {
    const ordered = logs.slice().sort((a, b) => {
      const unknownA = a.workout_type === CHAT_IMPORT_UNKNOWN_TYPE ? 1 : 0;
      const unknownB = b.workout_type === CHAT_IMPORT_UNKNOWN_TYPE ? 1 : 0;
      if (unknownA !== unknownB) return unknownB - unknownA;
      return b.workout_date.localeCompare(a.workout_date);
    });
    const dropped = ordered.slice(0, logs.length - count);
    const kept = logs.filter(log => dropped.indexOf(log) === -1);
    console.log(`  ${label}: ${logs.length} chat log(s) vs count ${count} - ${apply ? 'dropping' : 'would drop'} ${dropped.length} (${dropped.map(log => `${log.workout_date.slice(0, 10)} ${log.workout_type}`).join(', ')}).`);
    return kept;
  }

  const used = {};
  logs.forEach(log => { used[log.workout_date.slice(0, 10)] = true; });

  const padded = logs.slice();
  const free = span.filter(date => !used[date]);
  let cursor = 0;
  while (padded.length < count) {
    const date = free.length > 0 ? free[cursor % free.length] : span[cursor % span.length];
    cursor++;
    padded.push({
      name: logs.length > 0 ? logs[0].name : '',
      workout_date: `${date} 00:00:00`,
      workout_type: CHAT_IMPORT_UNKNOWN_TYPE,
      duration_minutes: 30
    });
  }

  padded.sort((a, b) => a.workout_date.localeCompare(b.workout_date));
  console.log(`  ${label}: ${logs.length} chat log(s) vs count ${count} - ${apply ? 'padding' : 'would pad'} ${count - logs.length} ${CHAT_IMPORT_UNKNOWN_TYPE}.`);
  return padded;
}

function _datesInSpan(startDate, endDate) {
  const dates = [];
  const cursor = new Date(`${startDate}T00:00:00`);
  const last = new Date(`${endDate}T00:00:00`);
  while (cursor <= last) {
    dates.push(Util.toDateString(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
}

function _sortRows(sheet, headers, columnNames) {
  const spec = columnNames
    .map(name => headers.indexOf(name) + 1)
    .filter(column => column > 0)
    .map(column => ({ column: column, ascending: true }));
  if (spec.length === 0) return;

  const lastRow = sheet.getLastRow();
  if (lastRow < 3) return;

  sheet.getRange(2, 1, lastRow - 1, headers.length).sort(spec);
}
