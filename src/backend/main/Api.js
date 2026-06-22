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
 * Supports RESTful path routing via e.pathInfo (e.g., .../exec/kakao).
 */
function doPost(e) {
  try {
    const path = e.pathInfo || "";
    const postData = e.postData.contents;
    const payload = JSON.parse(postData);
    
    console.log(`[doPost] Received request on path: /${path}`);

    // 1. REST Path: /kakao (Primary for Chatbot Skills)
    if (path === "kakao" || (payload.userRequest && payload.userRequest.user)) {
      const response = _executeApi('KakaoSkill', () => KakaoController.handleRequest(payload), payload);
      
      return ContentService.createTextOutput(JSON.stringify(response.data))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. Generic API or Webhook logs
    SystemLogService.addLog("POST_RECEIVED", { path, payload });
    
    return ContentService.createTextOutput(JSON.stringify({ success: true, message: "Data received" }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    console.error("[doPost] Error:", err.toString());
    
    // Fallback Kakao Error Response
    const errorResponse = {
      version: "2.0",
      template: {
        outputs: [{ simpleText: { text: "서버 처리 중 오류가 발생했습니다." } }]
      }
    };
    return ContentService.createTextOutput(JSON.stringify(errorResponse))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * HTML include helper
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/**
 * [Common] API Execution & Logging Helper
 * Used by both WebAppController and KakaoController.
 */
function _executeApi(apiName, action, params = null) {
  const paramLog = params ? JSON.stringify(params) : 'No Params';
  console.log(`▶ [${apiName}] Request: ${paramLog}`);

  const startTime = new Date().getTime();

  try {
    const result = action();
    const duration = new Date().getTime() - startTime;
    const successResponse = { success: true, data: result };

    const lowerName = apiName.toLowerCase();
    if (!lowerName.includes('get')) {
      SystemLogService.addLog(apiName, { params, duration: `${duration}ms`, status: 'SUCCESS' });
    }

    console.log(`✅ [${apiName}] Success (${duration}ms)`);
    return successResponse;

  } catch (err) {
    const duration = new Date().getTime() - startTime;
    console.error(`🔥 [${apiName}] Error (${duration}ms): ${err.toString()}`);
    SystemLogService.addLog(`${apiName}_ERROR`, { params, error: err.toString(), stack: err.stack });

    return { success: false, data: null, message: `System Error: ${err.toString()}` };
  }
}
