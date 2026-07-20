/**
 * Controller for handling Admin WebApp requests via google.script.run.
 * Wraps Service calls in the unified _executeApi wrapper for logging and error handling.
 */

// Member API
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

// Week API
function apiGetAllWeeks() {
  return _executeApi('apiGetAllWeeks', () => WorkoutWeekService.getAllWeeks());
}

function apiBatchSaveWeeks(weeksArray) {
  return _executeApi('apiBatchSaveWeeks', () => WorkoutWeekService.batchSaveWeeks(weeksArray), { weeksCount: weeksArray ? weeksArray.length : 0 });
}

// Workout API (Weekly Records)
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

// Workout Logs API (Detailed)
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

function apiBatchSaveWorkoutLogs(memberId, year, month, weekNumber, logsToAdd, logsToUpdate, logIdsToDelete, weeklyNote) {
  return _executeApi('apiBatchSaveWorkoutLogs', () => WorkoutLogService.batchSaveWorkoutLogs(memberId, year, month, weekNumber, logsToAdd, logsToUpdate, logIdsToDelete, weeklyNote), { memberId, year, month, weekNumber, addCount: logsToAdd.length, updateCount: logsToUpdate.length, deleteCount: logIdsToDelete.length, hasNote: !!weeklyNote });
}

// Reward API
function apiGetAllRewards() {
  return _executeApi('apiGetAllRewards', () => RewardService.getAllRewards());
}

function apiGetRewardsByMember(memberId) {
  return _executeApi('apiGetRewardsByMember', () => RewardService.getRewardsByMember(memberId), { memberId });
}

function apiAddReward(memberId, rewardDate, amount, description) {
  return _executeApi('apiAddReward', () => RewardService.addReward(memberId, rewardDate, amount, description), { memberId, rewardDate, amount, description });
}

function apiUpdateReward(rewardId, updateData) {
  return _executeApi('apiUpdateReward', () => RewardService.updateReward(rewardId, updateData), { rewardId, updateData });
}

function apiDeleteReward(rewardId) {
  return _executeApi('apiDeleteReward', () => RewardService.deleteReward(rewardId), { rewardId });
}

// System Logs API
function apiGetRecentLogs(limit) {
  return _executeApi('apiGetRecentLogs', () => SystemLogService.getRecentLogs(limit), { limit });
}

// Dashboard API
function apiGetDashboardSummary() {
  return _executeApi('apiGetDashboardSummary', () => {
    const activeMembers = MemberService.getActiveMembers();
    const now = new Date();
    const dateStr = Utilities.formatDate(now, "GMT+9", "yyyy-MM-dd");
    const currentWeek = WorkoutWeekService.getWeekByDate(dateStr);
    
    let weeklyCount = 0;
    if (currentWeek) {
      const records = WorkoutService.getRecordsByWeek(currentWeek.year, currentWeek.month, currentWeek.week_number);
      weeklyCount = records.reduce((sum, r) => sum + (parseInt(r.count) || 0), 0);
    }
    
    const rewards = RewardService.getAllRewards();
    const totalPrize = rewards.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);

    return {
      activeMemberCount: activeMembers.length,
      weeklyWorkoutCount: weeklyCount,
      totalPrizeAmount: totalPrize,
      currentWeekLabel: currentWeek ? `${currentWeek.month}월 ${currentWeek.week_number}주차` : '미지정'
    };
  });
}

// System API for Combined Initial Loading
function apiLoadInitialData() {
  return _executeApi('apiLoadInitialData', () => {
    const allMembers = MemberService.getAllMembers();
    const activeMembers = MemberService.getActiveMembers();
    const allRewards = RewardService.getAllRewards();
    const allWeeks = WorkoutWeekService.getAllWeeks();
    const allWorkoutRecords = WorkoutService.getAllRecords();
    const allWorkoutLogs = WorkoutLogService.getAllLogs();
    const recentLogs = SystemLogService.getRecentLogs(50);
    
    const now = new Date();
    const dateStr = Utilities.formatDate(now, "GMT+9", "yyyy-MM-dd");
    const currentWeek = WorkoutWeekService.getWeekByDate(dateStr);
    
    let weeklyCount = 0;
    if (currentWeek) {
      const records = WorkoutService.getRecordsByWeek(currentWeek.year, currentWeek.month, currentWeek.week_number);
      weeklyCount = records.reduce((sum, r) => sum + (parseInt(r.count) || 0), 0);
    }
    const totalPrize = allRewards.reduce((sum, r) => sum + (parseFloat(r.amount) || 0), 0);
    const dashboardSummary = {
      activeMemberCount: activeMembers.length,
      weeklyWorkoutCount: weeklyCount,
      totalPrizeAmount: totalPrize,
      currentWeekLabel: currentWeek ? `${currentWeek.month}월 ${currentWeek.week_number}주차` : '미지정'
    };

    return {
      members: allMembers,
      activeMembers: activeMembers,
      rewards: allRewards,
      weeks: allWeeks,
      workoutRecords: allWorkoutRecords,
      workoutLogs: allWorkoutLogs,
      recentLogs: recentLogs,
      dashboardSummary: dashboardSummary
    };
  });
}
