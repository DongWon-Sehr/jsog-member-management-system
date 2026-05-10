/**
 * Controller for handling Kakao Chatbot Skill requests.
 * Parses Kakao-specific JSON payloads and delegates to core Services.
 */
const KakaoController = {
  /**
   * Routes the incoming Kakao payload to the appropriate handler.
   */
  handleRequest(payload) {
    const intentName = payload.intent ? payload.intent.name : 'default';
    
    switch (intentName) {
      case '인증사진_전송':
        return this.onPhotoUpload(payload);
      
      case '인증데이터_확인':
        return this.onConfirmData(payload);

      default:
        return this.onDefault(payload);
    }
  },

  /**
   * Handler: When user sends a photo.
   */
  onPhotoUpload(payload) {
    const userKey = payload.userRequest.user.id;
    const imageUrl = payload.userRequest.params.media ? payload.userRequest.params.media.url : null;

    if (!imageUrl) {
      return this.sendSimpleText("인증 사진이 감지되지 않았습니다. 사진을 다시 보내주세요.");
    }

    // Delegation to KakaoService for business logic (OCR, analysis, etc.)
    return KakaoService.processPhoto(userKey, imageUrl);
  },

  /**
   * Handler: When user confirms or corrects the parsed data.
   */
  onConfirmData(payload) {
    const userKey = payload.userRequest.user.id;
    const params = payload.action.params || {};
    
    // Delegation to KakaoService
    return KakaoService.registerWorkout(userKey, params);
  },

  /**
   * Handler: Fallback / Welcome message.
   */
  onDefault(payload) {
    return this.sendSimpleText("안녕하세요! 주삼오공 챗봇입니다. 운동 인증 사진을 보내주시면 자동으로 기록해 드립니다.");
  },

  /**
   * Helper: Formats a simple text response for Kakao.
   */
  sendSimpleText(text) {
    return {
      version: "2.0",
      template: {
        outputs: [{ simpleText: { text: text } }]
      }
    };
  }
};
