/**
 * Service for Kakao-specific business logic.
 * Bridges the gap between Kakao Chatbot interactions and core System Services.
 */
const KakaoService = {
  /**
   * Orchestrates photo analysis (OCR).
   */
  processPhoto(userKey, imageUrl) {
    // 1. Check if user is a registered member
    const member = MemberService.getMemberByKakaoId(userKey);
    
    // 2. OCR and Analysis logic will go here
    // Note: This often requires Kakao Callback API due to 5s timeout
    
    return {
      version: "2.0",
      template: {
        outputs: [{ simpleText: { text: "사진을 확인했습니다. 운동 정보를 분석하는 중입니다..." } }]
      }
    };
  },

  /**
   * Finalizes workout registration after data validation.
   */
  registerWorkout(userKey, params) {
    // Logic for saving to sheet and updating counts
    return {
      version: "2.0",
      template: {
        outputs: [{ simpleText: { text: "인증이 완료되었습니다!" } }]
      }
    };
  }
};
