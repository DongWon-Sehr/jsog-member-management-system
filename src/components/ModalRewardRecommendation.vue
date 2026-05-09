<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm transition-all duration-300">
        <div class="absolute inset-0 bg-gray-900/60"></div>

        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300">
          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-indigo-50/30 shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <i class="ph-bold ph-magic-wand text-xl"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-900">리워드 지급 대상 추천</h3>
            </div>
          </div>

          <!-- Body -->
          <div class="flex-1 overflow-y-auto p-6 space-y-6">
            <!-- Period Selector -->
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex flex-col sm:flex-row gap-4 items-end">
              <div class="flex-1 space-y-1.5 w-full">
                <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">추천 기준 분기</label>
                <select v-model="selectedQuarter" class="w-full px-4 py-2.5 bg-white border-2 border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-gray-900 shadow-sm transition-all">
                  <option v-for="q in availableQuarters" :key="q.value" :value="q.value">{{ q.label }}</option>
                </select>
              </div>
              <button @click="calculateRecommendations" class="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95">
                분석하기
              </button>
            </div>

            <!-- Results -->
            <div v-if="recommendations.length > 0" class="space-y-4">
              <div class="flex items-center justify-between px-1">
                <h4 class="text-sm font-bold text-gray-700 uppercase tracking-wider">추천 대상 (상위 5명)</h4>
                <p class="text-[10px] font-medium text-gray-400">누적 운동 횟수 기준</p>
              </div>

              <div class="space-y-3">
                <div v-for="(rec, index) in recommendations" :key="rec.memberId" class="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center justify-between group hover:border-indigo-200 transition-all">
                  <div class="flex items-center gap-4">
                    <div class="w-8 h-8 flex items-center justify-center rounded-full font-black text-sm" :class="getRankClass(index)">
                      {{ index + 1 }}
                    </div>
                    <div class="flex flex-col">
                      <span class="font-bold text-gray-900">{{ rec.name }}</span>
                      <span class="text-[10px] font-bold text-indigo-500 uppercase">성공률 {{ rec.successRate }}%</span>
                    </div>
                  </div>
                  
                  <div class="flex items-center gap-4">
                    <div class="text-right">
                      <p class="text-lg font-black text-gray-900">{{ rec.totalCount }}회</p>
                      <p class="text-[10px] font-bold text-gray-400 uppercase">인증 완료</p>
                    </div>
                    <button @click="selectMember(rec)" class="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                      <i class="ph-bold ph-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div v-else-if="hasCalculated" class="py-20 text-center">
              <div class="inline-flex p-4 rounded-full bg-gray-50 mb-4">
                <i class="ph-bold ph-magnifying-glass text-gray-300 text-4xl"></i>
              </div>
              <p class="text-gray-400 font-bold">해당 기간의 기록이 없습니다.</p>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
            <button @click="close" class="px-8 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all text-sm">
              닫기
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from '../composables/useStore';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close', 'select']);
const { members, weeks, workoutRecords } = useStore();

const selectedQuarter = ref('');
const recommendations = ref([]);
const hasCalculated = ref(false);

const availableQuarters = computed(() => {
  const currentYear = new Date().getFullYear();
  return [
    { label: `${currentYear}년 1분기 (1~3월)`, value: `${currentYear}-Q1` },
    { label: `${currentYear}년 2분기 (4~6월)`, value: `${currentYear}-Q2` },
    { label: `${currentYear}년 3분기 (7~9월)`, value: `${currentYear}-Q3` },
    { label: `${currentYear}년 4분기 (10~12월)`, value: `${currentYear}-Q4` },
  ];
});

const calculateRecommendations = () => {
  if (!selectedQuarter.value) return;
  
  const [year, qStr] = selectedQuarter.value.split('-Q');
  const quarter = parseInt(qStr);
  const targetYear = parseInt(year);

  // Find weeks in this quarter
  const quarterWeeks = weeks.value.filter(w => {
    const q = Math.ceil(Number(w.month) / 3);
    return Number(w.year) === targetYear && q === quarter;
  });

  const totalWeeks = quarterWeeks.length;
  if (totalWeeks === 0) {
    recommendations.value = [];
    hasCalculated.value = true;
    return;
  }

  const results = members.value.map(m => {
    const records = workoutRecords.value.filter(r => {
      if (r.member_id !== m.id) return false;
      const isSameYear = Number(r.year) === targetYear;
      const rQuarter = Math.ceil(Number(r.month) / 3);
      return isSameYear && rQuarter === quarter;
    });

    const totalCount = records.reduce((sum, r) => sum + (Number(r.count) || 0), 0);
    // Success criteria: weekly count >= 3 or superpass used with count >= 1
    const successWeeks = records.filter(r => 
      Number(r.count) >= 3 || (Number(r.count) >= 1 && (r.super_pass === true || String(r.super_pass).toUpperCase() === 'TRUE'))
    ).length;

    return {
      memberId: m.id,
      name: m.name,
      totalCount,
      successWeeks,
      successRate: Math.round((successWeeks / totalWeeks) * 100) || 0
    };
  });

  recommendations.value = results
    .filter(r => r.totalCount > 0)
    .sort((a, b) => b.totalCount - a.totalCount || b.successWeeks - a.successWeeks)
    .slice(0, 5);
  
  hasCalculated.value = true;
};

const selectMember = (rec) => {
  emit('select', {
    memberId: rec.memberId,
    description: `${selectedQuarter.value} 우수 활동자 추천 (인증 ${rec.totalCount}회, 성공률 ${rec.successRate}%)`
  });
};

const getRankClass = (index) => {
  if (index === 0) return 'bg-amber-100 text-amber-600 border border-amber-200';
  if (index === 1) return 'bg-slate-100 text-slate-500 border border-slate-200';
  if (index === 2) return 'bg-orange-50 text-orange-600 border border-orange-100';
  return 'bg-gray-100 text-gray-500 border border-gray-200';
};

const handleEsc = (e) => {
  if (e.key === 'Escape' && props.isOpen) close();
};

onMounted(() => {
  window.addEventListener('keydown', handleEsc);
  const month = new Date().getMonth() + 1;
  const currentQ = Math.ceil(month / 3);
  selectedQuarter.value = `${new Date().getFullYear()}-Q${currentQ}`;
});

onUnmounted(() => window.removeEventListener('keydown', handleEsc));

const close = () => {
  emit('close');
};
</script>

<style scoped>
.modal-fade-enter-active, .modal-fade-leave-active {
  transition: all 0.3s ease;
}
.modal-fade-enter-from, .modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
