/**
 * File for testing server logic (GAS).
 * These functions can be run directly from the Apps Script editor.
 */

function test_MigrationSetup() {
  console.log("=== test_MigrationSetup Start ===");
  MigrationService.setup();
  console.log("Migration (Sheet and column setup) completed.");
  console.log("=== test_MigrationSetup End ===");
}

function test_MemberService() {
  console.log("=== test_MemberService Start ===");
  
  // 1. Test adding a new member
  const newMember = MemberService.addMember("TestUser", "test@example.com");
  console.log("New member added: " + JSON.stringify(newMember));
  
  // 2. Retrieve all members
  const allMembers = MemberService.getAllMembers();
  console.log("Total members count: " + allMembers.length);
  
  // 3. Test get member by ID
  const fetchedMember = MemberService.getMemberById(newMember.id);
  console.log("Fetched member by ID: " + (fetchedMember ? fetchedMember.name : "Not Found"));

  // 4. Test updating member
  const updateSuccess = MemberService.updateMember(newMember.id, { name: "UpdatedUser", email: "updated@example.com" });
  console.log("Member update success: " + updateSuccess);
  
  // 5. Test deactivation
  const deactivateSuccess = MemberService.deactivateMember(newMember.id);
  console.log("Member deactivation success: " + deactivateSuccess);

  // 6. Test reactivation
  const reactivateSuccess = MemberService.reactivateMember(newMember.id);
  console.log("Member reactivation success: " + reactivateSuccess);
  
  console.log("=== test_MemberService End ===");
}

function test_WorkoutService() {
  console.log("=== test_WorkoutService Start ===");
  
  const testMemberId = "test-uuid-1234";
  const year = 2026;
  const month = 5;
  const week = 1;
  
  // 1. Update count to 2 (Insert)
  WorkoutService.updateWorkoutCount(testMemberId, year, month, week, 2, false);
  console.log("Workout record Insert completed");
  
  // 2. Update count to 3, apply super pass (Update)
  WorkoutService.updateWorkoutCount(testMemberId, year, month, week, 3, true);
  console.log("Workout record Update completed");
  
  // 3. Retrieve records
  const records = WorkoutService.getRecordsByWeek(year, month, week);
  console.log("Retrieved records: " + JSON.stringify(records));
  console.log("=== test_WorkoutService End ===");
}

function test_WorkoutLogService() {
  console.log("=== test_WorkoutLogService Start ===");
  
  const testMemberId = "test-uuid-1234";
  
  // 1. Add a detailed workout log
  const newLog = WorkoutLogService.addWorkoutLog(testMemberId, "2026-05-06 18:30", "Running", 45);
  console.log("Detailed workout log added: " + JSON.stringify(newLog));
  
  // 2. Retrieve logs for the member
  const logs = WorkoutLogService.getLogsByMember(testMemberId);
  console.log("Total logs for member: " + logs.length);
  console.log("=== test_WorkoutLogService End ===");
}

function test_SystemLogService() {
  console.log("=== test_SystemLogService Start ===");
  
  // 1. Add a log entry
  const log = SystemLogService.addLog("TEST_ACTION", { message: "This is a test log", code: 200 });
  console.log("System log added: " + JSON.stringify(log));
  
  // 2. Retrieve recent logs
  const recentLogs = SystemLogService.getRecentLogs(5);
  console.log("Recent logs count: " + recentLogs.length);
  console.log("=== test_SystemLogService End ===");
}

function test_RewardService() {
  console.log("=== test_RewardService Start ===");
  
  const testMemberId = "test-uuid-1234";
  
  // 1. Add a reward log
  const newReward = RewardService.addReward(testMemberId, "2026-Q1", 50000, "Q1 1st Place Prize");
  console.log("Reward added: " + JSON.stringify(newReward));
  
  // 2. Retrieve rewards for member
  const memberRewards = RewardService.getRewardsByMember(testMemberId);
  console.log("Rewards for member: " + memberRewards.length);
  
  // 3. Retrieve all rewards
  const allRewards = RewardService.getAllRewards();
  console.log("Total rewards recorded: " + allRewards.length);
  
  console.log("=== test_RewardService End ===");
}

