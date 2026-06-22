/**
 * Manual Tests for MemberService
 * Run individual functions from GAS Editor.
 */

function test_manual_MemberService_addMember() {
  const name = "테스트유저";
  const email = "manual_test@example.com";
  
  console.log(`[MemberService] Starting addMember test for: ${name}`);
  // Uncomment to actually modify DB
  // const result = MemberService.addMember(name, email);
  // console.log("[Result]", result);
  console.log("[Simulation] Member would be added to sheet.");
}

function test_manual_MemberService_getMember() {
  const allMembers = MemberService.getAllMembers();
  console.log(`[MemberService] Total members found: ${allMembers.length}`);
  if (allMembers.length > 0) {
    console.log("[Sample Member]", allMembers[0]);
  }
}
