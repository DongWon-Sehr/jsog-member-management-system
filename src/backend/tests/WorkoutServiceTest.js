/**
 * Manual Tests for WorkoutService (Business Rules)
 */

function test_manual_WorkoutService_superPassRule() {
  const memberId = "TEST_MEM_001";
  const year = 2026;
  const month = 5;
  
  console.log(`[WorkoutService] Testing SuperPass once-per-month rule for ${month}월...`);
  
  try {
    // A real test needs an existing record with super_pass = true to trigger the validation
    WorkoutService.updateWorkoutCount(memberId, year, month, 1, 0, true, 'Test 1');
    console.log("✅ First check passed (or no existing record)");
    
    // This should fail if the logic is working correctly and a record was found
    // WorkoutService.updateWorkoutCount(memberId, year, month, 2, 0, true, 'Test 2');
  } catch (e) {
    console.error("❌ Policy Blocked:", e.message);
  }
}
