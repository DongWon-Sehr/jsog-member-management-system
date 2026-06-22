/**
 * Manual Tests for KakaoController (Payload Parsing)
 */

function test_manual_KakaoController_photoUpload() {
  const mockPayload = {
    userRequest: {
      user: { id: "K_TEST_USER_999" },
      params: { media: { url: "https://example.com/test_timestamp.jpg" } }
    },
    intent: { name: "인증사진_전송" }
  };

  console.log("[KakaoController] Simulating photo upload intent...");
  const response = KakaoController.handleRequest(mockPayload);
  console.log("[Response JSON]", JSON.stringify(response, null, 2));
}
