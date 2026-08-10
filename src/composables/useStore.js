import { ref, reactive, computed } from 'vue';

// --- Global Reactive State ---
const members = ref([]);

const joinedAtOf = (member) => {
  const value = member.joined_at || member.created_at || '';
  return String(value).split(' ')[0].split('T')[0] || '9999-12-31';
};

const byJoinedAt = (a, b) => {
  const dateA = joinedAtOf(a);
  const dateB = joinedAtOf(b);
  if (dateA !== dateB) return dateA < dateB ? -1 : 1;
  return String(a.name || '').localeCompare(String(b.name || ''), 'ko');
};

const sortedMembers = computed(() => [...members.value].sort(byJoinedAt));
const activeMembers = computed(() =>
  sortedMembers.value.filter(m => m.enabled === true || String(m.enabled).toUpperCase() === 'TRUE')
);

const hasJoinedBy = (member, date) => {
  if (!date) return true;
  const joined = member.joined_at || member.created_at || '';
  if (!joined) return true;
  return String(joined).split(' ')[0].split('T')[0] <= String(date).split(' ')[0].split('T')[0];
};

const membersJoinedBy = (date) => activeMembers.value.filter(m => hasJoinedBy(m, date));

const membersOfWeek = (week) => membersJoinedBy(week ? week.end_date : null);
const rewards = ref([]);
const weeks = ref([]);
const workoutRecords = ref([]);
const workoutLogs = ref([]);
const systemLogs = ref([]);
const dashboardSummary = reactive({
  activeMemberCount: 0,
  weeklyWorkoutCount: 0,
  totalPrizeAmount: 0
});
const isLoading = ref(false);
const loadingText = ref('데이터를 불러오는 중입니다... 🚀');
const currentView = ref('Dashboard'); // Moved from App.vue for global control
const selectedWeekId = ref(null);

// --- Caching / Computed State for Performance ---
const memberMap = computed(() => {
  const map = {};
  members.value.forEach(m => {
    map[m.id] = m;
  });
  return map;
});

// --- Constants ---
const LOADING_PHRASES = [
  "주삼오공 멤버 데이터를 불러오는 중... 🏃‍♂️",
  "이번 주 오운완 기록을 집계하고 있습니다. ✨",
  "열심히 운동한 기록을 동기화 중... 📊",
  "리워드 정산 내역을 확인하고 있습니다. 💰",
  "관리자 페이지를 최적화하는 중... 🛠️",
  "잠시만 기다려주세요. 거의 다 되었습니다! 😊",
];

/**
 * Global Store Composable
 */
export function useStore() {
  return {
    // State
    members,
    sortedMembers,
    activeMembers,
    hasJoinedBy,
    membersJoinedBy,
    membersOfWeek,
    rewards,
    weeks,
    workoutRecords,
    workoutLogs,
    systemLogs,
    dashboardSummary,
    isLoading,
    loadingText,
    currentView,
    selectedWeekId,
    
    // Computed / Cache
    memberMap,
    
    // Constants
    LOADING_PHRASES
  };
}
