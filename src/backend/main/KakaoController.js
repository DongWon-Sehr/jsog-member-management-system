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
    const userKey = payload.userRequest.user.id;
    const utterance = payload.userRequest.utterance;
    const params = payload.action.params || {};

    console.log(`[KakaoController] Request: ${intentName}, User: ${userKey}`);
    
    switch (intentName) {
      case '인증_시작': // User says "인증" or "운동"
        return KakaoService.startManualAuth(userKey);
      
      case '사용자_등록': // Combined intent: menu click + email mandatory parameter
        const email = params.email; // Filled by Kakao before calling Skill
        return KakaoService.verifyAndRegister(userKey, email);

      case '인증_데이터_전송': // User selected workout type and provided optional data
        return KakaoService.registerManualWorkout(userKey, params);

      case '인증사진_전송': // Existing photo intent (placeholder for now)
        const imageUrl = payload.userRequest.params.media ? payload.userRequest.params.media.url : null;
        if (!imageUrl) return this.sendSimpleText("사진이 감지되지 않았습니다.");
        return KakaoService.processPhoto(userKey, imageUrl);

      default:
        return this.onDefault(payload);
    }
  },

  /**
   * Handler: Fallback / Welcome message.
   */
  onDefault(payload) {
    return this.sendSimpleText("안녕하세요! 주삼오공 챗봇입니다. '인증'이라고 입력하시거나 운동 사진을 보내주세요.");
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
