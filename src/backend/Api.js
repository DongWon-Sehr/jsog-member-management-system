/**
 * WebApp Entry Point (HTML Serving)
 */
function doGet(e) {
  try {
    console.log("[doGet] Web App loading started");
    const webAppUrl = ScriptApp.getService().getUrl();
    
    // Use createTemplateFromFile to support <?= BASE_WEBAPP_URL ?> and <?!= include() ?>
    const template = HtmlService.createTemplateFromFile('index');
    template.BASE_WEBAPP_URL = webAppUrl;

    const output = template
      .evaluate()
      .setTitle('주삼오공 Admin Dashboard')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);

    console.log("[doGet] HTML template evaluated successfully");
    return output;
  } catch (err) {
    console.error("[doGet] Loading failed", err);
    return HtmlService.createHtmlOutput("Error: " + err.toString());
  }
}

/**
 * Handles HTTP POST requests.
 */
function doPost(e) {
  try {
    console.log("[doPost] Webhook loading started");
    const payload = JSON.parse(e.postData.contents);
    
    SystemLogService.addLog("WEBHOOK_RECEIVED", payload);

    if (payload.userRequest && payload.userRequest.user) {
      const response = _executeApi('KakaoWebhook', () => handleKakaoWebhook(payload), payload);
      return ContentService.createTextOutput(JSON.stringify(response.data))
        .setMimeType(ContentService.MimeType.JSON);
    }

    throw new Error("Unknown POST payload structure.");

  } catch (err) {
    console.error("[doPost] Webhook failed", err);
    SystemLogService.addLog("WEBHOOK_ERROR", err.message);
    
    return ContentService.createTextOutput(JSON.stringify({ status: "error", message: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Kakao Chatbot Webhook Handler (Placeholder)
 */
function handleKakaoWebhook(payload) {
  return {
    version: "2.0",
    template: {
      outputs: [
        {
          simpleText: {
            text: "요청이 접수되었습니다. (개발 중)"
          }
        }
      ]
    }
  };
}

/**
 * HTML include helper
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * [Common] API Execution & Logging Helper
 */
function _executeApi(apiName, action, params = null) {
  const paramLog = params ? JSON.stringify(params) : 'No Params';
  console.log(`▶ [${apiName}] Request: ${paramLog}`);

  const startTime = new Date().getTime();

  try {
    const result = action();
    const duration = new Date().getTime() - startTime;
    const successResponse = { success: true, data: result };

    let dataSummary = 'Data';
    if (Array.isArray(result)) {
      dataSummary = `Array(${result.length})`;
    } else if (typeof result === 'object' && result !== null) {
      dataSummary = 'Object';
    }
    console.log(`✅ [${apiName}] Success (${duration}ms): ${dataSummary}`);

    return successResponse;

  } catch (err) {
    const duration = new Date().getTime() - startTime;
    console.error(`🔥 [${apiName}] Error (${duration}ms): ${err.toString()}`);
    console.error(err.stack);
    return { success: false, data: null, message: `System Error: ${err.toString()}` };
  }
}

// ==========================================
// Member API
// ==========================================

function apiGetAllMembers() {
  return _executeApi('apiGetAllMembers', () => MemberService.getAllMembers());
}

function apiGetActiveMembers() {
  return _executeApi('apiGetActiveMembers', () => MemberService.getActiveMembers());
}

function apiGetMemberById(memberId) {
  return _executeApi('apiGetMemberById', () => MemberService.getMemberById(memberId), { memberId });
}

function apiAddMember(name, email) {
  return _executeApi('apiAddMember', () => MemberService.addMember(name, email), { name, email });
}

function apiUpdateMember(memberId, updateData) {
  return _executeApi('apiUpdateMember', () => MemberService.updateMember(memberId, updateData), { memberId, updateData });
}

function apiDeactivateMember(memberId) {
  return _executeApi('apiDeactivateMember', () => MemberService.deactivateMember(memberId), { memberId });
}

function apiReactivateMember(memberId) {
  return _executeApi('apiReactivateMember', () => MemberService.reactivateMember(memberId), { memberId });
}

// ==========================================
// Week API
// ==========================================

function apiGetAllWeeks() {
  return _executeApi('apiGetAllWeeks', () => WorkoutWeekService.getAllWeeks());
}

function apiBatchSaveWeeks(weeksArray) {
  return _executeApi('apiBatchSaveWeeks', () => WorkoutWeekService.batchSaveWeeks(weeksArray), { weeksCount: weeksArray ? weeksArray.length : 0 });
}

// ==========================================
// Workout API (Weekly Records)
// ==========================================

function apiGetAllWorkoutRecords() {
  return _executeApi('apiGetAllWorkoutRecords', () => WorkoutService.getAllRecords());
}

function apiGetRecordsByWeek(year, month, weekNumber) {
  return _executeApi('apiGetRecordsByWeek', () => WorkoutService.getRecordsByWeek(year, month, weekNumber), { year, month, weekNumber });
}

function apiUpdateWorkoutCount(memberId, year, month, weekNumber, count, superPass, note) {
  return _executeApi('apiUpdateWorkoutCount', () => WorkoutService.updateWorkoutCount(memberId, year, month, weekNumber, count, superPass, note), { memberId, year, month, weekNumber, count, superPass, note });
}

function apiBatchUpdateWorkoutCounts(recordsArray) {
  return _executeApi('apiBatchUpdateWorkoutCounts', () => WorkoutService.batchUpdateWorkoutCounts(recordsArray), { count: recordsArray ? recordsArray.length : 0 });
}

// ==========================================
// Workout Logs API (Detailed)
// ==========================================

function apiGetAllWorkoutLogs() {
  return _executeApi('apiGetAllWorkoutLogs', () => WorkoutLogService.getAllLogs());
}

function apiGetLogsByMember(memberId) {
  return _executeApi('apiGetLogsByMember', () => WorkoutLogService.getLogsByMember(memberId), { memberId });
}

function apiAddWorkoutLog(memberId, workoutDate, workoutType, durationMinutes, year, month, weekNumber) {
  return _executeApi('apiAddWorkoutLog', () => WorkoutLogService.addWorkoutLog(memberId, workoutDate, workoutType, durationMinutes, year, month, weekNumber), { memberId, workoutDate, workoutType, durationMinutes, year, month, weekNumber });
}

function apiDeleteWorkoutLog(logId, memberId, year, month, weekNumber) {
  return _executeApi('apiDeleteWorkoutLog', () => WorkoutLogService.deleteWorkoutLog(logId, memberId, year, month, weekNumber), { logId, memberId, year, month, weekNumber });
}

function apiBatchSaveWorkoutLogs(memberId, year, month, weekNumber, logsToAdd, logIdsToDelete) {
  return _executeApi('apiBatchSaveWorkoutLogs', () => WorkoutLogService.batchSaveWorkoutLogs(memberId, year, month, weekNumber, logsToAdd, logIdsToDelete), { memberId, year, month, weekNumber, addCount: logsToAdd.length, deleteCount: logIdsToDelete.length });
}

// ==========================================
// Reward API
// ==========================================

function apiGetAllRewards() {
  return _executeApi('apiGetAllRewards', () => RewardService.getAllRewards());
}

function apiGetRewardsByMember(memberId) {
  return _executeApi('apiGetRewardsByMember', () => RewardService.getRewardsByMember(memberId), { memberId });
}

function apiAddReward(memberId, rewardDate, amount, description) {
  return _executeApi('apiAddReward', () => RewardService.addReward(memberId, rewardDate, amount, description), { memberId, rewardDate, amount, description });
}

// ==========================================
// System Logs API
// ==========================================

function apiGetRecentLogs(limit) {
  return _executeApi('apiGetRecentLogs', () => SystemLogService.getRecentLogs(limit), { limit });
}

// ==========================================
// Dashboard API
// ==========================================

function apiGetDashboardSummary() {
  return _executeApi('apiGetDashboardSummary', () => {
    const activeMembers = MemberService.getActiveMembers();
    
    // Calculate current week context (Simplified logic for now)
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    
    // Fetch records for the last few months to find the most recent one
    // This is a temporary way to show "something" real on the dashboard
    const records = WorkoutService.getRecordsByWeek(year, month, 1); 
    
    const rewards = RewardService.getAllRewards();
    const totalPrize = rewards.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    return {
      activeMemberCount: activeMembers.length,
      weeklyWorkoutCount: records.reduce((sum, r) => sum + (parseInt(r.count) || 0), 0),
      totalPrizeAmount: totalPrize
    };
  });
}
