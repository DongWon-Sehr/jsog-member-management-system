/**
 * Service for Kakao-specific business logic.
 * Bridges the gap between Kakao Chatbot interactions and core System Services.
 */
const KakaoService = {
  /**
   * 1. Registration: Verifies email and links Kakao ID.
   * Called only after Kakao has successfully collected the 'email' parameter.
   */
  verifyAndRegister(userKey, email) {
    console.log(`[KakaoService] verifyAndRegister - UserKey: ${userKey}, Email: ${email}`);
    
    if (!email) {
      return this.createSimpleResponse("이메일 정보가 전달되지 않았습니다.");
    }

    const cleanEmail = String(email).trim();

    // 1. Email Format Validation (Since we use @sys.text)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return this.createSimpleResponse(`'${cleanEmail}'은 올바른 이메일 형식이 아닙니다. 정확한 이메일을 입력해주세요.`);
    }

    // 2. Database Lookup
    const member = MemberService.getMemberByEmail(cleanEmail);

    if (!member) {
      return this.createSimpleResponse(`'${cleanEmail}'은 등록되지 않은 이메일입니다. 시스템 관리자에게 멤버 등록을 먼저 요청해주세요.`);
    }

    // 3. Update the member record with the Kakao ID (kakao_plus_id)
    try {
      const success = MemberService.updateMember(member.id, { kakao_plus_id: userKey });

      if (success) {
        return this.createSimpleResponse(`🎉 인증 완료!\n이제부터 [${member.name}]님으로 운동 인증이 가능합니다.`);
      } else {
        throw new Error("MemberService.updateMember returned false");
      }
    } catch (e) {
      console.error(`[KakaoService] Update Error: ${e.toString()}`);
      return this.createSimpleResponse("죄송합니다. 시스템 오류로 등록에 실패했습니다. 잠시 후 다시 시도해주세요.");
    }
  },

  /**
   * Starts manual authentication by showing workout type options.
   */
  startManualAuth(userKey) {
    const member = MemberService.getMemberByKakaoId(userKey);
    
    // If not registered via Kakao ID, prompt for registration
    if (!member) {
      return this.responseWithQuickReplies(
        "등록된 사용자 정보를 찾을 수 없습니다. 먼저 [사용자 등록] 메뉴를 통해 이메일 인증을 완료해주세요.",
        [
          { label: "👤 사용자 등록", message: "사용자 등록" },
          { label: "❓ 도움말", message: "도움말" }
        ]
      );
    }

    return this.responseWithQuickReplies(
      `🏃 ${member.name}님, 반갑습니다!\n오늘 어떤 운동을 하셨나요?`,
      [
        { label: "🔥 러닝", message: "러닝 인증할게" },
        { label: "💪 헬스", message: "헬스 인증할게" },
        { label: "🧘 요가", message: "요가 인증할게" },
        { label: "✨ 기타", message: "기타 운동 인증할게" }
      ]
    );
  },

  /**
   * Registers workout log manually.
   */
  registerManualWorkout(userKey, params) {
    // 1. Identify member
    let member = MemberService.getMemberByKakaoId(userKey);
    
    // Fallback: search by name if provided (for manual testing/proxy)
    if (!member && params.member_name) {
      member = MemberService.getMemberByName(params.member_name);
    }

    if (!member) {
      return this.createSimpleResponse("인증 대상을 찾을 수 없습니다. 먼저 사용자 등록을 완료해주세요.");
    }

    // 2. Extract workout details
    const workoutType = params.workout_type || "기타";
    const duration = parseInt(params.duration) || 30;
    
    // 3. Get current week data
    const now = new Date();
    const dateStr = Utilities.formatDate(now, "GMT+9", "yyyy-MM-dd");
    const week = WorkoutWeekService.getWeekByDate(dateStr);

    if (!week) {
      return this.createSimpleResponse("현재 진행 중인 운동 주차 정보가 없습니다. 관리자에게 문의하세요.");
    }

    // A rest week holds no workout records, so an authentication here would leave a log with no
    // count attached to it. Turn it away instead of half-recording it.
    if (WorkoutWeekService.isRestWeek(week)) {
      const restEnd = Util.toDateString(week.end_date);
      return this.createSimpleResponse(`☕ 이번 주(${Util.toDateString(week.start_date)} ~ ${restEnd})는 휴식주간이라 운동 인증을 받지 않습니다.\n다음 운동주차에 다시 인증해주세요!`);
    }

    // 4. Register Log (This automatically updates counts)
    try {
      WorkoutLogService.addWorkoutLog(
        member.id, 
        dateStr, 
        workoutType, 
        duration, 
        week.year, 
        week.month, 
        week.week_number
      );

      // 5. Generate Leaderboard Text for sharing
      const leaderboardText = this._generateLeaderboardText(week);

      return {
        version: "2.0",
        template: {
          outputs: [
            { simpleText: { text: `✅ ${member.name}님, ${workoutType} 인증 완료!` } },
            { simpleText: { text: leaderboardText } }
          ]
        }
      };
    } catch (e) {
      console.error(`[KakaoService] Registration Error: ${e.toString()}`);
      return this.createSimpleResponse(`오류 발생: ${e.message}`);
    }
  },

  /**
   * Orchestrates photo analysis (OCR Placeholder).
   */
  processPhoto(userKey, imageUrl) {
    return this.createSimpleResponse("사진을 확인했습니다. (OCR 분석 기능은 현재 개발 중입니다)");
  },

  /**
   * Helper: Formats a response with Quick Replies.
   */
  responseWithQuickReplies(text, replies) {
    return {
      version: "2.0",
      template: {
        outputs: [{ simpleText: { text: text } }] ,
        quickReplies: replies.map(r => ({
          label: r.label,
          action: "message",
          messageText: r.message
        }))
      }
    };
  },

  /**
   * Helper: Simple Text Response.
   */
  createSimpleResponse(text) {
    return {
      version: "2.0",
      template: {
        outputs: [{ simpleText: { text: text } }]
      }
    };
  },

  /**
   * Private: Generates the copy-paste leaderboard text.
   */
  _generateLeaderboardText(week) {
    const records = WorkoutService.getRecordsByWeek(week.year, week.month, week.week_number);
    const activeMembers = MemberService.getActiveMembers();
    
    let text = `🔥 주삼오공 (${week.month}-${week.week_number}주차)\n`;
    text += `--------------------------\n`;
    
    // Sort by count descending
    const sorted = [...activeMembers].map(m => {
      const rec = records.find(r => String(r.member_id) === String(m.id));
      return {
        name: m.name,
        count: rec ? parseInt(rec.count) : 0,
        sp: rec ? (rec.super_pass === true || String(rec.super_pass).toUpperCase() === 'TRUE') : false
      };
    }).sort((a, b) => b.count - a.count);

    sorted.forEach((item, idx) => {
      let status = item.count >= 3 ? "✅" : "🏃";
      if (item.sp) status = "✨(S)";
      text += `${idx + 1}. ${item.name} (${item.count}회) ${status}\n`;
    });
    
    text += `--------------------------\n`;
    text += `복사해서 오픈톡방에 인증하세요!`;
    return text;
  }
};
