/**
 * Service for managing quarterly/half-yearly rewards
 */
const RewardService = {
  /**
   * Adds a new reward record
   * 
   * @param {string} memberId - The UUID of the member receiving the reward
   * @param {string} rewardDate - Date or period of the reward (e.g., '2026-Q1' or '2026-06-30')
   * @param {number|string} amount - The amount or value of the prize
   * @param {string} description - Additional details (e.g., 'Q1 Max Workouts', 'Half-year 1st place')
   */
  addReward(memberId, rewardDate, amount, description = '') {
    const sheet = Util.getSheet('rewards_log');
    if (!sheet) throw new Error('rewards_log sheet not found');

    const newReward = {
      id: Util.generateUUID(),
      member_id: memberId,
      reward_date: rewardDate,
      amount: amount,
      description: description,
      created_at: Util.getCurrentTimestamp()
    };

    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const rowData = headers.map(header => newReward[header] !== undefined ? newReward[header] : '');
    
    sheet.appendRow(rowData);
    return newReward;
  },

  /**
   * Retrieves all rewards for a specific member
   */
  getRewardsByMember(memberId) {
    const sheet = Util.getSheet('rewards_log');
    if (!sheet) throw new Error('rewards_log sheet not found');

    const rewards = Util.sheetToObjects(sheet);
    const filtered = rewards.filter(reward => reward.member_id === memberId);
    return Util.sanitizeData(filtered);
  },

  /**
   * Retrieves all rewards
   */
  getAllRewards() {
    const sheet = Util.getSheet('rewards_log');
    if (!sheet) throw new Error('rewards_log sheet not found');

    return Util.sanitizeData(Util.sheetToObjects(sheet));
  }
};
