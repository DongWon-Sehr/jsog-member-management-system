/**
 * Manual Tests for Utils and Formatting
 */

function test_unit_Util_sanitizeData() {
  const testDate = new Date(2026, 4, 10, 15, 45, 30); // 2026-05-10 15:45:30
  const result = Util.sanitizeData(testDate);
  
  console.log(`[Util] Sanitize Date Test`);
  console.log(`Input:  ${testDate}`);
  console.log(`Output: ${result}`);
  
  if (result === '2026-05-10 15:45:30') {
    console.log("✅ Unit Test Passed");
  } else {
    console.error("❌ Unit Test Failed: Format mismatch");
  }
}
