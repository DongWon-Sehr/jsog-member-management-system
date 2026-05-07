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
  return; // Backup mode: disabled to prevent accidental duplicates
  console.log("=== run_migrateWorkoutRecords2026 Start (Final Batch Mode) ===");
  
  const rawData = `기간	🐟동원	🌿재연	😃소희	🐶혜운	🐹지영	👻찬미	🥳주현	🍒채린	🌴현주	😃유림	😃영철	🎧누리	🫛수완	🧚🏻‍♀️수희	🐧진구	🍷찬준
01/05 ~ 01/11	1	3		6	0	5	0	6	4	1	4	3	2	5		
01/12 ~ 01/18	1	3		3	0	3	3	3	1	3	1	3	1	3		
01/19 ~ 01/25	2	3		6	3	6	3	5	4	1	1	2	4	6		
01/26 ~ 02/01	1	3		5	1	7	1	4	3	3	1	4	2	4		
02/02 ~ 02/08	3	3		8	3	7	0	5	5	3	0	4	3	6		
02/09 ~ 02/15	3	2		7	1	6	3	5	2	3	1	1	4	6		
02/16 ~ 02/22	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간	보너스 휴식 주간
02/23 ~ 03/01	2	3		4	4	7	0	2	2	3	1	1	3	7		
03/02 ~ 03/08	3	3		8	3	8	3	3	3	3	1	3	2	7	5	
03/09 ~ 03/15	3	4		6	3	8	1	3	4	3		3	3	6	5	
03/16 ~ 03/22	1	4		7	2	5	3	5	3	3		3	2	7	5	
03/23 ~ 03/29	1	4		6	3	8	1	2	2	1		3	1	8	5	
03/30 ~ 04/05	0	3		8	3	6	3	2	3	3		4	5	7	5	
2026-1 정산	21	38	0	74	26	76	21	45	36	30	10	34	32	72	25	
04/06 ~ 04/12	2	3		7	2	3		(부상휴식)	3	1		1	5	4	3	
04/13 ~ 04/19	3	4		6	3	4		(부상휴식)	4	3		0	4	7	4	
04/20 ~ 04/26	0	3		9	3	4		2	6	3		0	3	8	5	
04/27 ~ 05/03	6	3		5	4	3		3	3	3		1	1	6	4`;

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

  let currentYear = 2026;
  let currentMonth = 1; 
  let weekNumber = 1;

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const cells = line.split('\t').map(c => c.trim());
    const period = cells[0];

    // 1. Skip settlement rows
    if (period.includes('정산')) continue;

    // 2. Skip global "보너스 휴식 주간" rows
    const isGlobalSkipWeek = period.includes('보너스 휴식 주간') || cells.some(c => c === '보너스 휴식 주간');
    if (isGlobalSkipWeek) {
      console.log(`[Migration] Ignoring global rest week: ${period}`);
      continue;
    }

    for (let j = 1; j < cells.length; j++) {
      const cellValue = cells[j];
      const memberName = memberNames[j - 1];
      const memberId = memberMap[memberName];

      if (!memberId || cellValue === '') continue;

      let count = 0;
      let note = '';
      
      // Parse cell value: Numbers vs Notes
      if (isNaN(parseInt(cellValue, 10))) {
        count = 0;
        note = cellValue;
      } else {
        count = parseInt(cellValue, 10);
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
    
    // 3. Increment week counter for VALID data rows only
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

  console.log(`Migration Complete: Batch inserted ${newRowsData.length} records for 2026.`);
  console.log("=== run_migrateWorkoutRecords2026 End ===");
}
