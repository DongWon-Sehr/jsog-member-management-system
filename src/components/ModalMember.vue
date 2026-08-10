<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center backdrop-blur-sm bg-black/40 p-4 sm:p-0">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-lg transform transition-all overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
          
          <!-- Header -->
          <div class="px-6 py-4 border-b border-gray-50 flex flex-col bg-indigo-50/30 shrink-0">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-xl font-black text-gray-900 flex items-center gap-2">
                <i :class="isEditMode ? 'ph-bold ph-pencil-simple' : 'ph-bold ph-user-plus'" class="text-indigo-600"></i>
                {{ isEditMode ? '회원 정보 관리' : '신규 회원 등록' }}
              </h3>
            </div>
            
            <!-- Tabs (Only show in Edit Mode) -->
            <div v-if="isEditMode" class="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
              <button 
                @click="activeTab = 'info'"
                class="px-4 py-1.5 rounded-lg text-xs font-black transition-all"
                :class="activeTab === 'info' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              >
                기본 정보
              </button>
              <button 
                @click="activeTab = 'activity'"
                class="px-4 py-1.5 rounded-lg text-xs font-black transition-all"
                :class="activeTab === 'activity' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'"
              >
                활동 이력
              </button>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto">
            <!-- Tab: Info -->
            <div v-if="activeTab === 'info'" class="px-8 py-8 space-y-6">
              <div class="space-y-1.5">
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">이름</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i class="ph-fill ph-user text-gray-300 group-focus-within:text-indigo-500 transition-colors"></i>
                  </div>
                  <input 
                    v-model="form.name"
                    type="text" 
                    placeholder="닉네임을 입력하세요"
                    class="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">이메일 (선택)</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i class="ph-fill ph-envelope-simple text-gray-300 group-focus-within:text-indigo-500 transition-colors"></i>
                  </div>
                  <input 
                    v-model="form.email"
                    type="email" 
                    placeholder="example@email.com"
                    class="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">가입일</label>
                <div class="relative group">
                  <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <i class="ph-fill ph-calendar-blank text-gray-300 group-focus-within:text-indigo-500 transition-colors"></i>
                  </div>
                  <input
                    v-model="form.joinedAt"
                    type="date"
                    class="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
                  />
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">환급 계좌 (선택)</label>
                <div class="grid grid-cols-3 gap-2">
                  <div class="relative group">
                    <input
                      v-model="form.bankType"
                      type="text"
                      list="bank-list"
                      placeholder="은행"
                      class="w-full px-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
                    />
                    <datalist id="bank-list">
                      <option v-for="bank in BANKS" :key="bank" :value="bank"></option>
                    </datalist>
                  </div>
                  <div class="relative group col-span-2">
                    <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <i class="ph-fill ph-credit-card text-gray-300 group-focus-within:text-indigo-500 transition-colors"></i>
                    </div>
                    <input
                      :value="form.bankAccount"
                      @input="onAccountInput"
                      @paste="onAccountPaste"
                      type="text"
                      inputmode="numeric"
                      placeholder="계좌번호 (숫자만)"
                      class="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <!-- Status Toggle (Only in Edit Mode) -->
              <div v-if="isEditMode" class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
                <div class="flex flex-col justify-center">
                  <p class="text-sm font-black text-gray-900">활동 상태</p>
                  <p class="text-xs text-gray-400 font-medium">{{ form.enabled ? '현재 활동 중입니다' : '현재 비활성 상태입니다' }}</p>
                </div>
                <button 
                  @click="form.enabled = !form.enabled"
                  class="relative block h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ring-offset-2 focus:ring-2 ring-indigo-500"
                  :class="form.enabled ? 'bg-indigo-600' : 'bg-gray-300'"
                >
                  <span 
                    class="absolute top-1 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-all duration-200 ease-in-out"
                    :class="form.enabled ? 'left-6' : 'left-1'"
                  ></span>
                </button>
              </div>
            </div>

            <!-- Tab: Activity -->
            <div v-else-if="activeTab === 'activity'" class="px-8 py-8 space-y-6">
              <!-- Summary Cards -->
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 shadow-inner">
                  <p class="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">총 인증 횟수</p>
                  <p class="text-2xl font-black text-indigo-700">{{ stats.totalWorkouts }}회</p>
                </div>
                <div class="bg-amber-50 p-4 rounded-2xl border border-amber-100 shadow-inner">
                  <p class="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">누적 리워드</p>
                  <p class="text-2xl font-black text-amber-700">{{ stats.totalRewardAmount.toLocaleString() }}원</p>
                </div>
              </div>

              <!-- Performance Section -->
              <div class="space-y-3">
                <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">분기별 달성 현황</h4>
                <div class="space-y-2">
                  <div v-for="q in stats.quarterlyStats" :key="q.label" class="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span class="text-sm font-bold text-gray-700">{{ q.label }}</span>
                    <div class="flex items-center gap-3">
                      <div class="text-right">
                        <p class="text-xs font-black text-gray-900">{{ q.count }}회 인증</p>
                        <p class="text-[9px] font-bold text-indigo-500 uppercase">성공률 {{ q.successRate }}%</p>
                      </div>
                    </div>
                  </div>
                  <div v-if="stats.quarterlyStats.length === 0" class="py-10 text-center text-gray-400 text-sm font-bold">활동 기록이 없습니다.</div>
                </div>
              </div>

              <!-- Reward History -->
              <div class="space-y-3">
                <h4 class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">최근 리워드 내역</h4>
                <div class="space-y-2">
                  <div v-for="r in stats.recentRewards" :key="r.id" class="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl shadow-sm">
                    <div class="flex flex-col">
                      <span class="text-xs font-bold text-gray-900">{{ r.description }}</span>
                      <span class="text-[9px] font-medium text-gray-400 font-mono">{{ r.reward_date }}</span>
                    </div>
                    <span class="text-sm font-black text-amber-600">{{ Number(r.amount).toLocaleString() }}원</span>
                  </div>
                  <div v-if="stats.recentRewards.length === 0" class="py-10 text-center text-gray-400 text-sm font-bold">지급된 리워드가 없습니다.</div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-6 bg-gray-50/50 flex gap-3 shrink-0">
            <button @click="close" class="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black shadow-sm hover:bg-gray-100 transition-all active:scale-95 text-sm sm:text-base">닫기</button>
            <button v-if="activeTab === 'info'" @click="save" class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 text-sm sm:text-base">저장하기</button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { toRef } from 'vue';
import { useScrollLock } from '../composables/useScrollLock';
import { ref, reactive, watch, onMounted, onUnmounted, computed } from 'vue';
import { useDialog } from '../composables/useDialog';
import { useStore } from '../composables/useStore';
import { isRestWeek } from '../composables/weekUtils';

const props = defineProps({
  isOpen: Boolean,
  memberData: Object
});

useScrollLock(toRef(props, 'isOpen'));

const emit = defineEmits(['close', 'save']);
const { alert } = useDialog();
const { workoutRecords, rewards, weeks } = useStore();

const isEditMode = ref(false);
const activeTab = ref('info');
const form = reactive({
  id: '',
  name: '',
  email: '',
  joinedAt: '',
  bankType: '',
  bankAccount: '',
  enabled: true
});

const today = () => new Date().toISOString().split('T')[0];

const BANKS = ['카카오뱅크', '토스뱅크', '케이뱅크', '국민', '신한', '우리', '하나', '농협', '기업',
  'SC제일', '씨티', '새마을금고', '우체국', '부산', '대구', '경남', '광주', '전북', '제주', '수협', '산업'];

const BANK_ALIASES = {
  '카카오뱅크': ['카카오뱅크', '카뱅', 'kakaobank'],
  '토스뱅크': ['토스뱅크', '토스', 'toss'],
  '케이뱅크': ['케이뱅크', 'k뱅크', 'kbank'],
  '국민': ['국민', 'kb'],
  '신한': ['신한', 'shinhan'],
  '우리': ['우리', 'woori'],
  '하나': ['하나', 'keb', 'hana'],
  '농협': ['농협', 'nh'],
  '기업': ['기업', 'ibk'],
  'SC제일': ['sc제일', 'sc'],
  '씨티': ['씨티', 'citi'],
  '새마을금고': ['새마을'],
  '우체국': ['우체국'],
  '부산': ['부산'], '대구': ['대구'], '경남': ['경남'], '광주': ['광주'],
  '전북': ['전북'], '제주': ['제주'], '수협': ['수협'], '산업': ['산업', 'kdb']
};

const ACCOUNT_PREFIXES = [
  { prefix: '3333', bank: '카카오뱅크' },
  { prefix: '1000', bank: '토스뱅크' }
];

const bankFromText = (text) => {
  const compact = String(text).toLowerCase().replace(/\s/g, '');
  for (const [bank, aliases] of Object.entries(BANK_ALIASES)) {
    if (aliases.some(alias => compact.includes(alias))) return bank;
  }
  return '';
};

const bankFromAccount = (digits) => {
  const match = ACCOUNT_PREFIXES.find(entry => digits.startsWith(entry.prefix));
  return match ? match.bank : '';
};

const onAccountInput = (event) => {
  const input = event.target;
  const raw = input.value;
  const digits = raw.replace(/\D/g, '');

  form.bankAccount = digits;

  if (raw !== digits) {
    const caret = input.selectionStart === null ? raw.length : input.selectionStart;
    const kept = raw.slice(0, caret).replace(/\D/g, '').length;
    input.value = digits;
    input.setSelectionRange(kept, kept);
  }

  if (!form.bankType) form.bankType = bankFromAccount(digits);
};

const onAccountPaste = (event) => {
  const text = (event.clipboardData || window.clipboardData || { getData: () => '' }).getData('text');
  if (!form.bankType) {
    const bank = bankFromText(text);
    if (bank) form.bankType = bank;
  }
};

// Stats Calculation for Activity Tab
const stats = computed(() => {
  if (!props.memberData || !props.memberData.id) {
    return { totalWorkouts: 0, totalRewardAmount: 0, quarterlyStats: [], recentRewards: [] };
  }

  const memberId = props.memberData.id;
  const memberRecords = workoutRecords.value.filter(r => r.member_id === memberId);
  const memberRewards = rewards.value.filter(r => r.member_id === memberId);

  const totalWorkouts = memberRecords.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
  const totalRewardAmount = memberRewards.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  // Group by Quarter
  const qMap = {};
  memberRecords.forEach(r => {
    const q = Math.ceil(Number(r.month) / 3);
    const label = `${r.year} Q${q}`;
    if (!qMap[label]) qMap[label] = { count: 0, successWeeks: 0, totalWeeks: 0 };
    
    qMap[label].count += (Number(r.count) || 0);
    const isSuccess = Number(r.count) >= 3 || (Number(r.count) >= 1 && (r.super_pass === true || String(r.super_pass).toUpperCase() === 'TRUE'));
    if (isSuccess) qMap[label].successWeeks++;
  });

  // Count total possible weeks per quarter for success rate
  Object.keys(qMap).forEach(label => {
    const [year, qPart] = label.split(' Q');
    const quarter = parseInt(qPart);
    const targetYear = parseInt(year);
    qMap[label].totalWeeks = weeks.value.filter(w =>
      Number(w.year) === targetYear && Math.ceil(Number(w.month) / 3) === quarter && !isRestWeek(w)
    ).length;
  });

  const quarterlyStats = Object.entries(qMap).map(([label, data]) => ({
    label,
    count: data.count,
    successRate: Math.round((data.successWeeks / data.totalWeeks) * 100) || 0
  })).sort((a, b) => b.label.localeCompare(a.label));

  const recentRewards = [...memberRewards]
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 5);

  return { totalWorkouts, totalRewardAmount, quarterlyStats, recentRewards };
});

const handleEsc = (e) => {
  if (e.key === 'Escape' && props.isOpen) close();
};

onMounted(() => window.addEventListener('keydown', handleEsc));
onUnmounted(() => window.removeEventListener('keydown', handleEsc));

watch(() => props.memberData, (newVal) => {
  activeTab.value = 'info'; // Reset tab on open/change
  if (newVal) {
    isEditMode.value = true;
    form.id = newVal.id;
    form.name = newVal.name;
    form.email = newVal.email || '';
    form.joinedAt = (newVal.joined_at || newVal.created_at || '').split(' ')[0].split('T')[0];
    form.bankType = newVal.bank_type || '';
    form.bankAccount = newVal.bank_account || '';
    form.enabled = newVal.enabled === true || newVal.enabled === 'TRUE' || newVal.enabled === 'true';
  } else {
    isEditMode.value = false;
    form.id = '';
    form.name = '';
    form.email = '';
    form.joinedAt = today();
    form.bankType = '';
    form.bankAccount = '';
    form.enabled = true;
  }
}, { immediate: true });

const close = () => {
  emit('close');
};

const save = () => {
  if (!form.name.trim()) {
    alert({ message: '이름을 입력해주세요.', isDanger: true });
    return;
  }
  emit('save', { ...form, bankAccount: String(form.bankAccount || '').replace(/\D/g, '') });
};
</script>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>