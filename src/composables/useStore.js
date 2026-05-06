import { ref, reactive, computed } from 'vue';

// --- Global Reactive State ---
const members = ref([]);
const activeMembers = ref([]);
const rewards = ref([]);
const dashboardSummary = reactive({
  activeMemberCount: 0,
  weeklyWorkoutCount: 0,
  totalPrizeAmount: 0
});
const isLoading = ref(false);
const loadingText = ref('데이터를 불러오는 중입니다... 🚀');

// --- Caching / Computed State for Performance ---
// ID-based Map for instant member lookup
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
    activeMembers,
    rewards,
    dashboardSummary,
    isLoading,
    loadingText,
    
    // Computed / Cache
    memberMap,
    
    // Constants
    LOADING_PHRASES
  };
}
