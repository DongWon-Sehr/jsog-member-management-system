/**
 * Extracts the weekly leaderboard history out of a KakaoTalk chat export and writes it as a
 * GAS-loadable data file (src/backend/main/ChatImportData.js).
 *
 * The chat is the only record of the group's first two years: every week someone posts a
 * leaderboard message, and each member copy-pastes it back with their own number bumped. The last
 * posting of a week is therefore the settled result for that week.
 *
 * Usage:
 *   node scripts/parse-kakao-chat.js [path/to/export.csv] [--out <file>] [--json <file>]
 *
 * Nothing here talks to the spreadsheet - importing the generated file is
 * ChatHistoryMigration.js's job, run by hand from the Apps Script editor.
 */

import { readFileSync, writeFileSync, readdirSync } from 'fs';
import { join, basename } from 'path';

const DEFAULT_CSV_DIR = 'migration';
const DEFAULT_OUT = 'src/backend/main/ChatImportData.js';

// ---------------------------------------------------------------------------
// CSV
// ---------------------------------------------------------------------------

/** Minimal RFC4180 reader - messages are multi-line and quoted, so split('\n') will not do. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else quoted = false;
      } else field += ch;
      continue;
    }

    if (ch === '"') { quoted = true; continue; }
    if (ch === ',') { row.push(field); field = ''; continue; }
    if (ch === '\r') continue;
    if (ch === '\n') { row.push(field); rows.push(row); row = []; field = ''; continue; }
    field += ch;
  }
  if (field !== '' || row.length > 0) { row.push(field); rows.push(row); }

  const headers = rows.shift().map(h => h.replace(/^﻿/, '').trim());
  return rows
    .filter(r => r.length === headers.length)
    .map(r => Object.fromEntries(headers.map((h, i) => [h, r[i]])));
}

// ---------------------------------------------------------------------------
// Dates
// ---------------------------------------------------------------------------

const dateString = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const daysBetween = (a, b) => Math.round((b - a) / 86400000);

/**
 * Snaps a posted start date to the Monday of its week.
 *
 * A week runs Monday to Sunday, but the header is typed by hand and occasionally names the Sunday
 * before it (04/13 for the 04/14 week). Snapping to the nearest Monday keeps those postings on the
 * same week as the rest of the history instead of inventing a 6-day week.
 */
function snapToMonday(date) {
  const offset = (date.getDay() + 6) % 7; // Mon=0 ... Sun=6
  return offset <= 3 ? addDays(date, -offset) : addDays(date, 7 - offset);
}

/** Resolves 'M/D' against the posting timestamp, so a 12/29 header posted in January stays in December. */
function resolveDate(month, day, postedAt) {
  let best = null;
  for (const year of [postedAt.getFullYear() - 1, postedAt.getFullYear(), postedAt.getFullYear() + 1]) {
    const candidate = new Date(year, month - 1, day);
    if (candidate.getMonth() !== month - 1) continue; // e.g. 2/30
    const distance = Math.abs(daysBetween(candidate, postedAt));
    if (!best || distance < best.distance) best = { date: candidate, distance };
  }
  return best && best.distance <= 30 ? best.date : null;
}

// ---------------------------------------------------------------------------
// Message parsing
// ---------------------------------------------------------------------------

const YEAR_RE = /(20\d\d)\s*년/;
const RANGE_RE = /\(\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*[-~–]\s*(\d{1,2})\s*\/\s*(\d{1,2})\s*\)/;
// '5-1 주차' | '5월 첫째주' | '5월 2주차'
const LABEL_RE = /(\d{1,2})\s*-\s*(\d{1,2})\s*주\s*차|(\d{1,2})\s*월\s*(?:(첫|둘|셋|넷|다섯|여섯)째\s*주|(\d)\s*주\s*차)/;
const ORDINALS = { 첫: 1, 둘: 2, 셋: 3, 넷: 4, 다섯: 5, 여섯: 6 };
// '🐟동원 : 3 (슈퍼패스)' | '- 재연 : 0' | '😃소희 : '
const ENTRY_RE = /^[^가-힣]*([가-힣]{2,4})\s*[:：]\s*(\d{0,2})\s*(.*)$/;
// Lines of the boilerplate that also end in a colon, and words that are never a member name
const NOT_A_NAME = new Set(['인증사진', '운동', '운동종류', '복붙해서', '참고', '공지', '기타', '주차']);

function parseHeader(line, postedAt) {
  const year = YEAR_RE.exec(line);
  const range = RANGE_RE.exec(line);
  if (!year || !range) return null;

  const start = resolveDate(Number(range[1]), Number(range[2]), postedAt);
  if (!start) return null;

  const label = LABEL_RE.exec(line);
  let month = null;
  let weekNumber = null;
  if (label) {
    if (label[1]) { month = Number(label[1]); weekNumber = Number(label[2]); }
    else if (label[4]) { month = Number(label[3]); weekNumber = ORDINALS[label[4]]; }
    else { month = Number(label[3]); weekNumber = Number(label[5]); }
  }

  const startDate = snapToMonday(start);
  return {
    startDate,
    endDate: addDays(startDate, 6),
    year: Number(year[1]),
    month,
    weekNumber,
    isFinal: /최종|마감/.test(line)
  };
}

function parseEntries(lines) {
  const entries = new Map();
  for (const raw of lines) {
    const match = ENTRY_RE.exec(raw.trim());
    if (!match) continue;

    const [, name, digits, tail] = match;
    if (NOT_A_NAME.has(name)) continue;

    const note = tail.trim();
    entries.set(name, {
      count: digits === '' ? null : Number(digits),
      superPass: /슈퍼\s*패스|슈패/.test(note),
      note
    });
  }
  return entries;
}

// ---------------------------------------------------------------------------
// Certification messages ("헬스 1시간")
// ---------------------------------------------------------------------------

/**
 * Workout vocabulary, most specific first. Every spelling the group actually used in two years of
 * chat, including typos ('핼스', '크오스핏'), abbreviations ('클밍', '트밀') and in-jokes
 * ('새태' = 새벽 테니스, '페메' = 페이스메이커). Anything not listed becomes 기타(알수없음).
 */
const WORKOUT_TYPES = [
  ['등산', ['등반', '둘레길', '마실길', '산행']],
  ['러닝', ['러닝', '런닝', '트밀', '트레드밀', '런데이', '달리기', '조깅', '걷뛰', '인터벌', '마라톤',
           '뜀박질', '뛈박질', '뛰뛰', '나이키런', '페메', '런']],
  ['걷기', ['걷기', '산책', '워킹', '플로깅', '등산', '하이킹', '트래킹', '트레킹', '스텝밀']],
  ['요가', ['요가', '하타', '빈야사', '아쉬탕가']],
  ['클라이밍', ['클라이밍', '클밍', '볼더링', '클라이민', '망클']],
  ['수영', ['수영', '아쿠아']],
  ['사이클', ['자전거', '사이클', '싸이클', '스피닝', '라이딩', '자장구', '따릉이']],
  ['필라테스', ['필라테스', '필테']],
  ['크로스핏', ['크로스핏', '크핏', '크오스핏', '서킷']],
  ['테니스', ['테니스', '새태', '밤테', '금밤태']],
  ['SNPE', ['snpe']],
  ['F45', ['f45']],
  ['점핑', ['점핑']],
  ['헬스', ['헬스', '핼스', '헹스', '웨이트', 'pt', '피티', '하체', '상체', '어깨', '가슴', '등', '머신',
           '로잉', '홈트', '기구', '근력', '유산소', '인클라인', '복근', '전신', '천계', '천국의계단']],
  ['스쿼시', ['스쿼시']], ['배드민턴', ['배드민턴']], ['풋살', ['풋살', '축구']], ['농구', ['농구']],
  ['발레', ['발레']], ['댄스', ['춤', '댄스', '줌바']], ['골프', ['골프']], ['탁구', ['탁구']],
  ['볼링', ['볼링']], ['스케이트', ['스케이트', '스키']],
  ['복싱', ['복싱', '주짓수', '검도', '사브르', '펜싱']],
  ['재활', ['재활', '재홯', '번지', '피지오']]
];

const UNKNOWN_TYPE = '기타(알수없음)';
const DEFAULT_MINUTES = 30;

/** Distance with no activity word ('4.7km', '8키로') is always a run in this chat. */
const DISTANCE_ONLY_RE = /^\d+(?:\.\d+)?\s*(?:km|k|키로|킬로)$/i;

function classifyWorkout(text) {
  const compact = text.toLowerCase().replace(/\s+/g, '');
  if (!compact) return null;
  if (DISTANCE_ONLY_RE.test(compact)) return '러닝';
  for (const [canonical, keywords] of WORKOUT_TYPES) {
    if (keywords.some(keyword => compact.includes(keyword))) return canonical;
  }
  return null;
}

// Chatter that happens to carry a number of minutes ('30분 채우묜 인정합니다')
const CHATTER_RE = /인정|쳐주|해주시|예정|담에|측정|끝난|계신|미쵸|조지|늦춘|이었|되겠|채워|고고|패스|린정|꺼질|못꼈|날라|어떠신|합미다|이면|환급/;
// Trailing verb: '헬스 1시간 했습니다' / '90분 걸었슴다' - the verb also names the activity
const VERB_TAIL_RE = /\s*(했|하|탔|뛰|걸|찍|밟|타)\S{0,8}$/;
const VERB_TYPE = [[/걸/, '걷기'], [/뛰/, '러닝'], [/탔/, '사이클']];
const TRAILING_JUNK_RE = /[^가-힣A-Za-z0-9)]+$/;
const KOREAN_HOURS = { 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5 };
const DURATION_RE = /(?:(\d+(?:\.\d+)?)\s*(?:시간|h|H)\s*(?:(\d{1,3})\s*분)?|(\d{1,3})\s*분)\s*(반)?/;

/**
 * Parses one chat message into { type, minutes } - minutes null when the message names an activity
 * but no duration ('러닝 10k').
 *
 * A message like '헬스+유산소 1시간 40분' is one workout, not two: the leaderboard counts it once,
 * and treating '+' as a separator matched the leaderboard measurably worse.
 */
function parseCertification(rawMessage) {
  if (rawMessage.includes('\n') || rawMessage.length > 45) return null;

  let text = rawMessage.trim().replace(TRAILING_JUNK_RE, '');
  for (const [word, digit] of Object.entries(KOREAN_HOURS)) {
    text = text.replace(new RegExp(`${word}\\s*시간`, 'g'), `${digit}시간`);
  }
  text = text.replace(/뷴/g, '분');
  if (CHATTER_RE.test(text)) return null;

  const duration = DURATION_RE.exec(text);
  if (duration) {
    const hours = duration[1] ? Number(duration[1]) : 0;
    const minutes = Number(duration[2] || duration[3] || 0);
    const total = Math.round(hours * 60 + minutes + (duration[4] ? 30 : 0));
    const around = (text.slice(0, duration.index) + ' ' + text.slice(duration.index + duration[0].length));
    const type = classifyFromText(around);
    if (type && total >= 5 && total <= 300) return { type, minutes: total };
    if (type) return { type, minutes: null };   // implausible duration - keep the activity only
    return null;
  }

  const type = classifyFromText(text);
  return type ? { type, minutes: null } : null;
}

/** Resolves the activity from the words around the duration, falling back to the trailing verb. */
function classifyFromText(text) {
  const trimmed = text.trim();
  const verb = VERB_TAIL_RE.exec(trimmed);
  const stripped = trimmed.replace(VERB_TAIL_RE, '').replace(/[.,~!/()]+/g, ' ').trim();

  const type = classifyWorkout(stripped);
  if (type) return type;
  if (verb) {
    const match = VERB_TYPE.find(([pattern]) => pattern.test(verb[1]));
    if (match) return match[1];
  }
  return null;
}

function parseCertifications(rows, nameOf) {
  const byMember = new Map();
  for (const row of rows) {
    const member = nameOf(row.User);
    if (!member) continue;
    const parsed = parseCertification(row.Message || '');
    if (!parsed) continue;
    if (!byMember.has(member)) byMember.set(member, []);
    byMember.get(member).push({ at: new Date(row.Date.replace(' ', 'T')), ...parsed });
  }
  for (const list of byMember.values()) list.sort((a, b) => a.at - b.at);
  return byMember;
}

function parsePostings(rows) {
  const postings = [];
  for (const row of rows) {
    const message = row.Message || '';
    const postedAt = new Date(row.Date.replace(' ', 'T'));
    if (Number.isNaN(postedAt.getTime())) continue;

    const lines = message.split('\n');
    const header = parseHeader(lines[0], postedAt);
    if (!header) continue;

    const entries = parseEntries(lines.slice(1));
    if (entries.size === 0) continue;

    postings.push({ ...header, postedAt, author: row.User, entries });
  }
  return postings;
}

// ---------------------------------------------------------------------------
// Week assembly
// ---------------------------------------------------------------------------

const mostCommon = values => {
  const tally = new Map();
  values.forEach(v => tally.set(v, (tally.get(v) || 0) + 1));
  return [...tally.entries()].sort((a, b) => b[1] - a[1])[0][0];
};

/**
 * Reconstructs one workout log per certification, from the leaderboard alone.
 *
 * Every posting is a copy of the previous one with a single number bumped, so a member's number
 * going up in a posting *is* a certification, and the posting's timestamp dates it. The activity
 * and duration then come from that member's certification message just before the bump ('헬스
 * 1시간'), which is how the group actually posts: photo → 종류/시간 → leaderboard paste.
 *
 * The leaderboard count is the authority: this returns exactly `count` logs per member, padding
 * with 기타(알수없음) when a bump is missing (the member already had a number in the week's first
 * posting) and dropping the least-evidenced when there are more bumps than the settled count (a
 * number that was raised and later corrected down).
 */
const clampToSpan = (date, span) => (date < span.start ? span.start : (date > span.end ? span.end : date));

function buildLogs(group, span, settledCounts, certifications, warnings) {
  // The workout is described before the leaderboard is pasted more often than after, but both
  // happen; a bump is never further than a few hours from the message that explains it.
  const MATCH_BEFORE_MS = 8 * 3600 * 1000;
  const MATCH_AFTER_MS = 2 * 3600 * 1000;
  const bumps = new Map();   // member -> [{ at }]
  const previous = new Map();

  for (const posting of group) {
    for (const [name, entry] of posting.entries) {
      const count = entry.count === null ? 0 : entry.count;
      const before = previous.get(name);
      if (before !== undefined && count > before) {
        if (!bumps.has(name)) bumps.set(name, []);
        for (let i = 0; i < count - before; i++) bumps.get(name).push({ at: posting.postedAt });
      }
      previous.set(name, before === undefined ? count : Math.max(before, count));
    }
  }

  const logs = [];
  for (const [name, target] of settledCounts) {
    if (target <= 0) continue;

    const memberBumps = bumps.get(name) || [];
    const messages = certifications.get(name) || [];

    // Pair each bump with its nearest certification message, closest pair first, each message used
    // at most once. Two things force this shape rather than a simple backwards scan:
    // the message can come *after* the bump - several members paste the leaderboard first and say
    // '헬스 1시간' seconds later - and one workout described twice ('57분 페메로 다녀왔습니당', an
    // hour after the fact) must not attach itself to a second bump and invent an activity for it.
    const pairs = [];
    memberBumps.forEach((bump, bumpIndex) => {
      messages.forEach((message, messageIndex) => {
        const gap = bump.at - message.at;
        if (gap > MATCH_BEFORE_MS || -gap > MATCH_AFTER_MS) return;
        pairs.push({ distance: Math.abs(gap), bumpIndex, messageIndex });
      });
    });
    pairs.sort((a, b) => a.distance - b.distance || a.bumpIndex - b.bumpIndex);

    const takenBump = new Map();
    const takenMessage = new Set();
    for (const pair of pairs) {
      if (takenBump.has(pair.bumpIndex) || takenMessage.has(pair.messageIndex)) continue;
      takenBump.set(pair.bumpIndex, messages[pair.messageIndex]);
      takenMessage.add(pair.messageIndex);
    }

    const candidates = memberBumps.map((bump, index) => ({
      at: bump.at,
      message: takenBump.get(index) || null
    }));

    // More bumps than the settled count: drop the ones with no message behind them first.
    while (candidates.length > target) {
      const index = candidates.findIndex(c => !c.message);
      candidates.splice(index === -1 ? 0 : index, 1);
    }
    // Fewer bumps than the settled count: the missing one predates the week's first posting.
    while (candidates.length < target) {
      candidates.push({ at: group[0].postedAt, message: null });
    }

    for (const candidate of candidates) {
      logs.push({
        name,
        // The chat never records when a workout happened, only when it was posted. Store the date
        // at midnight rather than pretend the posting time is the workout time, and keep it inside
        // the week: a Sunday-night workout is routinely posted after midnight, and a log outside
        // the span would drop out of the weekly count the moment it is recalculated.
        workout_date: `${clampToSpan(dateString(candidate.at), span)} 00:00:00`,
        workout_type: candidate.message ? candidate.message.type : UNKNOWN_TYPE,
        duration_minutes: candidate.message && candidate.message.minutes ? candidate.message.minutes : DEFAULT_MINUTES,
        source: !candidate.message ? 'none' : (candidate.message.minutes ? 'message' : 'type-only')
      });
    }
  }

  logs.sort((a, b) => a.workout_date.localeCompare(b.workout_date) || a.name.localeCompare(b.name));
  return logs;
}

/**
 * Collapses the postings of a week into one settled row.
 *
 * A week is identified by its start date, never by its (month, week) label: the label is typed by
 * hand and a poster occasionally carries the previous week's one over. The label is decided by
 * majority vote for the same reason. Counts come from the posting marked (최종)/(마감) - the
 * admin's close-out of the week - falling back to the last posting when a week was never closed.
 */
function buildWeeks(postings, certifications, warnings) {
  const byStart = new Map();
  for (const posting of postings) {
    const key = dateString(posting.startDate);
    if (!byStart.has(key)) byStart.set(key, []);
    byStart.get(key).push(posting);
  }

  const weeks = [];
  for (const [startDate, group] of [...byStart.entries()].sort()) {
    group.sort((a, b) => a.postedAt - b.postedAt);
    // The week's close-out, not merely the last thing posted: a member may paste the board again
    // after the admin has closed the week, and a correction spotted days later comes as another
    // (최종) posting, which this picks up because it takes the last one.
    const closed = group.filter(p => p.isFinal);
    const settled = closed.length ? closed[closed.length - 1] : group[group.length - 1];

    const labelled = group.filter(p => p.weekNumber !== null);
    const year = mostCommon(group.map(p => p.year));
    const month = labelled.length ? mostCommon(labelled.map(p => p.month)) : settled.startDate.getMonth() + 1;
    const weekNumber = labelled.length ? mostCommon(labelled.map(p => p.weekNumber)) : 0;

    if (!labelled.length) {
      warnings.push(`${startDate}: no (month, week) label in any posting - falling back to month ${month}, week 0.`);
    }
    if (!group.some(p => p.isFinal)) {
      warnings.push(`${startDate}: no posting marked 최종/마감 - using the last of ${group.length} postings (${dateString(settled.postedAt)}).`);
    }

    const records = [];
    const settledCounts = new Map();
    for (const [name, entry] of settled.entries) {
      // No number and no note means the member simply never filled their line in that week.
      // Writing a 0 would claim they failed; leave the record out and let the sheet stay empty.
      if (entry.count === null && !entry.note) continue;
      const count = entry.count === null ? 0 : entry.count;
      settledCounts.set(name, count);
      records.push({
        name,
        count,
        super_pass: entry.superPass,
        note: entry.note
      });
    }

    const logs = buildLogs(
      group,
      { start: startDate, end: dateString(settled.endDate) },
      settledCounts,
      certifications,
      warnings
    );

    weeks.push({
      start_date: startDate,
      end_date: dateString(settled.endDate),
      year,
      month,
      week_number: weekNumber,
      is_rest_week: false,
      postings: group.length,
      settled_at: `${dateString(settled.postedAt)} ${settled.postedAt.toTimeString().slice(0, 8)}`,
      records,
      logs
    });
  }
  return weeks;
}

/**
 * Fills the holes in the Monday sequence with rest weeks.
 *
 * A rest week has no leaderboard, so it leaves a 14-day step between two posted weeks. Every such
 * hole in this export lines up with a 보너스 휴식 주간 announced in the chat, so the gap is a
 * reliable signal - but a hole longer than one week is not, and is only reported.
 */
function fillRestWeeks(weeks, warnings) {
  const filled = [];
  for (let i = 0; i < weeks.length; i++) {
    filled.push(weeks[i]);
    if (i === weeks.length - 1) continue;

    const gap = daysBetween(new Date(weeks[i].start_date), new Date(weeks[i + 1].start_date)) / 7;
    if (gap === 1) continue;

    if (gap !== 2) {
      warnings.push(`${weeks[i].start_date} → ${weeks[i + 1].start_date}: ${gap} week gap, too long to assume a single rest week. Left empty.`);
      continue;
    }

    const start = addDays(new Date(weeks[i].start_date), 7);
    filled.push({
      start_date: dateString(start),
      end_date: dateString(addDays(start, 6)),
      year: start.getFullYear(),
      month: start.getMonth() + 1,
      week_number: 0, // 0 = never assigned; is_rest_week is what marks it as a rest week
      is_rest_week: true,
      postings: 0,
      settled_at: '',
      records: [],
      logs: []
    });
  }
  return filled;
}

/** (year, month, week_number) is the join key for workout_records and must be unique among non-rest weeks. */
function checkLabelCollisions(weeks, warnings) {
  const seen = new Map();
  for (const week of weeks) {
    if (week.is_rest_week) continue;
    const label = `${week.year}-${week.month}-${week.week_number}`;
    if (seen.has(label)) {
      warnings.push(`Label collision: ${label} is claimed by both ${seen.get(label)} and ${week.start_date}. The import will skip the second one.`);
    } else {
      seen.set(label, week.start_date);
    }
  }
}

// ---------------------------------------------------------------------------
// Rewards
// ---------------------------------------------------------------------------

/**
 * Quarterly first-place awards, read by hand out of the chat.
 *
 * These are not machine-extractable: each one is a free-form announcement ("이번 2025년 2분기
 * 1등은...🥁 총 61회 달성한 🍒채린 님 입니다!") with no fixed shape, and there are only eight in two
 * years. They live here rather than in the generated file so that regenerating does not lose them.
 *
 * Shaped like the rows already in rewards_log ('2026-Q1 우수 활동자 / 구매상품: 아디다스 러닝화'):
 * `reward_date` is the day the winner was announced in the chat, and the description carries the
 * period. The 구매상품 half is left off - what was actually bought is never posted.
 *
 * 2025 lines up with calendar quarters; 2024 does not, because the group started in February and
 * ran on its own 회차 numbering, so those keep the label the chat used.
 *
 * `amount` is deliberately empty. The prize is bought out of the pooled unrefunded deposits and its
 * value is never once stated in the chat, so any number here would be invented. The admin can fill
 * it in from the reward tab afterwards.
 */
const CURATED_REWARDS = [
  { member_id: '가은', reward_date: '2024-05-03', description: '2024-1회차 우수 활동자' },
  { member_id: '동원', reward_date: '2024-07-29', description: '2024-2회차 우수 활동자' },
  { member_id: '찬미', reward_date: '2024-10-28', description: '2024-3회차 우수 활동자 (8~10월 65회)' },
  { member_id: '지영', reward_date: '2024-12-30', description: '2024-4회차 우수 활동자 (11~12월 44회)' },
  { member_id: '지영', reward_date: '2025-03-31', description: '2025-Q1 우수 활동자 (74회)' },
  { member_id: '채린', reward_date: '2025-06-30', description: '2025-Q2 우수 활동자 (61회)' },
  { member_id: '재연', reward_date: '2025-09-29', description: '2025-Q3 우수 활동자 (39회)' },
  { member_id: '혜운', reward_date: '2025-12-29', description: '2025-Q4 우수 활동자' }
];

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function render(weeks, source) {
  const body = weeks.map(week => {
    const records = week.records
      .map(r => `      { name: ${JSON.stringify(r.name)}, count: ${r.count}, super_pass: ${r.super_pass}, note: ${JSON.stringify(r.note)} }`)
      .join(',\n');
    const logs = week.logs
      .map(l => `      { name: ${JSON.stringify(l.name)}, workout_date: '${l.workout_date}', workout_type: ${JSON.stringify(l.workout_type)}, duration_minutes: ${l.duration_minutes} }`)
      .join(',\n');
    return [
      '  {',
      `    start_date: '${week.start_date}', end_date: '${week.end_date}',`,
      `    year: ${week.year}, month: ${week.month}, week_number: ${week.week_number}, is_rest_week: ${week.is_rest_week},`,
      `    postings: ${week.postings}, settled_at: ${JSON.stringify(week.settled_at)},`,
      records ? `    records: [\n${records}\n    ],` : '    records: [],',
      logs ? `    logs: [\n${logs}\n    ]` : '    logs: []',
      '  }'
    ].join('\n');
  }).join(',\n');

  const restWeeks = weeks.filter(w => w.is_rest_week).length;
  const records = weeks.reduce((sum, w) => sum + w.records.length, 0);
  const logCount = weeks.reduce((sum, w) => sum + w.logs.length, 0);

  return `/**
 * Weekly history extracted from the KakaoTalk chat export - GENERATED FILE, DO NOT EDIT BY HAND.
 *
 * Source: ${source}
 * Generated by: node scripts/parse-kakao-chat.js
 * Contents: ${weeks.length} weeks (${restWeeks} rest), ${records} member records, ${logCount} workout logs,
 *           ${CURATED_REWARDS.length} rewards, ${weeks[0].start_date} ~ ${weeks[weeks.length - 1].end_date}
 *
 * Imported by run_importChatHistory() in DataMigration.js, which only fills in what the sheet
 * is missing.
 * \`name\` is the short name used in the chat; the import matches it against the Hangul part of
 * member.name (the sheet stores them with an emoji prefix, e.g. '🐟동원').
 * A rest week carries no records and its week_number is 0 ("never assigned").
 * \`logs\` always holds exactly \`count\` entries per member - the leaderboard is the authority on
 * how many workouts a week held. Each log is dated at midnight because the chat records when a
 * certification was posted, never when the workout happened. '${UNKNOWN_TYPE}' with
 * ${DEFAULT_MINUTES} minutes means the certification carried no 종류/시간 message.
 */
const CHAT_IMPORT_UNKNOWN_TYPE = ${JSON.stringify(UNKNOWN_TYPE)};

/**
 * Quarterly 1st-place awards. \`amount\` is empty on purpose: the prize is bought out of the pooled
 * unrefunded deposits and its value is never stated in the chat, so it is the admin's to fill in.
 */
const CHAT_IMPORT_REWARDS = [
${CURATED_REWARDS.map(r => `  { name: ${JSON.stringify(r.name)}, reward_date: '${r.reward_date}', amount: '', description: ${JSON.stringify(r.description)} }`).join(',\n')}
];

const CHAT_IMPORT_WEEKS = [
${body}
];
`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

function resolveCsvPath(argPath) {
  if (argPath) return argPath;
  const candidates = readdirSync(DEFAULT_CSV_DIR).filter(f => f.toLowerCase().endsWith('.csv'));
  if (candidates.length !== 1) {
    throw new Error(`Expected exactly one CSV in ${DEFAULT_CSV_DIR}/, found ${candidates.length}. Pass the path explicitly.`);
  }
  return join(DEFAULT_CSV_DIR, candidates[0]);
}

/**
 * Maps a KakaoTalk display name ('서동원 DongWon', '가은이💕') to the short name the leaderboard
 * uses ('동원', '가은), by finding the leaderboard name contained in the author's Hangul.
 * Derived rather than hard-coded so a renamed or newly joined member needs no code change.
 */
function buildNameResolver(postings, warnings) {
  const shortNames = new Set();
  postings.forEach(p => p.entries.forEach((_, name) => shortNames.add(name)));

  const resolved = new Map();
  return author => {
    if (resolved.has(author)) return resolved.get(author);

    const hangul = String(author || '').replace(/[^가-힣]/g, '');
    const matches = [...shortNames].filter(name => hangul.includes(name));
    let picked = null;
    if (matches.length === 1) {
      picked = matches[0];
    } else if (matches.length > 1) {
      warnings.push(`Chat author '${author}' matches several leaderboard names (${matches.join(', ')}) - their certification messages are ignored.`);
    }
    resolved.set(author, picked);
    return picked;
  };
}

function main() {
  const args = process.argv.slice(2);
  const flag = name => {
    const i = args.indexOf(name);
    return i === -1 ? null : args[i + 1];
  };
  const positional = args.filter((a, i) => !a.startsWith('--') && !(i > 0 && args[i - 1].startsWith('--')));

  const csvPath = resolveCsvPath(positional[0]);
  const outPath = flag('--out') || DEFAULT_OUT;
  const jsonPath = flag('--json');

  const rows = parseCsv(readFileSync(csvPath, 'utf-8'));
  const warnings = [];
  const postings = parsePostings(rows);
  if (postings.length === 0) throw new Error('No leaderboard postings found - is this the right export?');

  const nameOf = buildNameResolver(postings, warnings);
  const certifications = parseCertifications(rows, nameOf);

  let weeks = buildWeeks(postings, certifications, warnings);
  weeks = fillRestWeeks(weeks, warnings);
  checkLabelCollisions(weeks, warnings);

  writeFileSync(outPath, render(weeks, basename(csvPath)));
  if (jsonPath) writeFileSync(jsonPath, JSON.stringify(weeks, null, 2));

  const records = weeks.reduce((sum, w) => sum + w.records.length, 0);
  const logs = weeks.flatMap(w => w.logs);
  const bySource = logs.reduce((tally, log) => ({ ...tally, [log.source]: (tally[log.source] || 0) + 1 }), {});
  const mismatched = weeks.flatMap(w =>
    w.records.filter(r => r.count !== w.logs.filter(l => l.name === r.name).length)
  ).length;

  console.log(`Read     ${rows.length} messages from ${csvPath}`);
  console.log(`Parsed   ${postings.length} leaderboard postings, ${[...certifications.values()].reduce((n, l) => n + l.length, 0)} certification messages`);
  console.log(`Weeks    ${weeks.length} (${weeks.filter(w => w.is_rest_week).length} rest), ${weeks[0].start_date} ~ ${weeks[weeks.length - 1].end_date}`);
  console.log(`Records  ${records}`);
  console.log(`Logs     ${logs.length} - ${bySource.message || 0} with 종류+시간, ${bySource['type-only'] || 0} 종류만 (${DEFAULT_MINUTES}분), ${bySource.none || 0} ${UNKNOWN_TYPE}`);
  console.log(`         log count matches the leaderboard for ${records - mismatched}/${records} member-weeks`);
  console.log(`Wrote    ${outPath}${jsonPath ? ` and ${jsonPath}` : ''}`);
  if (warnings.length) {
    console.log(`\n${warnings.length} warning(s):`);
    warnings.forEach(w => console.log(`  - ${w}`));
  }
}

main();
