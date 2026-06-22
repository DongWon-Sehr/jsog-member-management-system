/**
 * Service for managing quarterly/half-yearly rewards
 */
const RewardService = {
  tableName: 'rewards_log',
  
  get sheet() {
    if (!this._sheet) {
      this._sheet = Util.getSheet(this.tableName);
      if (!this._sheet) throw new Error(`${this.tableName} sheet not found`);
    }
    return this._sheet;
  },

  /**
   * Adds a new reward record
   * 
   * @param {string} memberId - The UUID of the member receiving the reward
   * @param {string} rewardDate - Date or period of the reward (e.g., '2026-Q1' or '2026-06-30')
   * @param {number|string} amount - The amount or value of the prize
   * @param {string} description - Additional details (e.g., 'Q1 Max Workouts', 'Half-year 1st place')
   */
  addReward(memberId, rewardDate, amount, description = '') {
    const newReward = {
      id: Util.generateUUID(),
      member_id: memberId,
      reward_date: rewardDate,
      amount: amount,
      description: description,
      created_at: Util.getCurrentTimestamp()
    };

    const headers = this.sheet.getRange(1, 1, 1, this.sheet.getLastColumn()).getValues()[0];
    const rowData = headers.map(header => newReward[header] !== undefined ? newReward[header] : '');
    
    this.sheet.appendRow(rowData);
    return newReward;
  },

  /**
   * Updates an existing reward entry (member_id, reward_date, amount, description)
   * @param {string} rewardId
   * @param {Object} updateData
   */
  updateReward(rewardId, updateData) {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');

    if (idIndex === -1) throw new Error(`Required columns not found in ${this.tableName} sheet`);

    const fields = ['member_id', 'reward_date', 'amount', 'description'];

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === rewardId) {
        const rowIndex = i + 1; // 1-based index
        fields.forEach(field => {
          if (updateData[field] !== undefined) {
            const colIndex = headers.indexOf(field);
            if (colIndex !== -1) this.sheet.getRange(rowIndex, colIndex + 1).setValue(updateData[field]);
          }
        });
        return true;
      }
    }
    return false;
  },

  /**
   * Deletes a reward entry
   * @param {string} rewardId
   */
  deleteReward(rewardId) {
    const data = this.sheet.getDataRange().getValues();
    const headers = data[0];
    const idIndex = headers.indexOf('id');

    for (let i = 1; i < data.length; i++) {
      if (data[i][idIndex] === rewardId) {
        this.sheet.deleteRow(i + 1);
        return true;
      }
    }
    return false;
  },

  /**
   * Retrieves all rewards for a specific member
   */
  getRewardsByMember(memberId) {
    const rewards = Util.sheetToObjects(this.sheet, this.tableName);
    const filtered = rewards.filter(reward => reward.member_id === memberId);
    return Util.sanitizeData(filtered);
  },

  /**
   * Retrieves all rewards
   */
  getAllRewards() {
    return Util.sanitizeData(Util.sheetToObjects(this.sheet, this.tableName));
  }
};
