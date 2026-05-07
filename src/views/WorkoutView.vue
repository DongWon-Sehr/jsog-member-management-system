<template>
  <div class="space-y-6 pb-20">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
      <div class="flex flex-col">
        <h2 class="text-2xl font-bold text-gray-800">운동 기록</h2>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Year Selector -->
        <div class="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm transition-all focus-within:border-indigo-500">
          <button @click="navigateYear(-1)" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="이전 연도">
            <i class="ph-bold ph-caret-left"></i>
          </button>
          <select v-model="selectedYear" class="bg-transparent text-gray-700 font-bold outline-none cursor-pointer text-center appearance-none px-2 text-sm">
            <option v-for="y in availableYears" :key="y" :value="y">{{ y }}년</option>
          </select>
          <button @click="navigateYear(1)" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="다음 연도">
            <i class="ph-bold ph-caret-right"></i>
          </button>
        </div>

        <!-- Week Selector (Filtered by Year & Non-Rest Weeks) -->
        <div class="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm transition-all focus-within:border-indigo-500">
          <button @click="navigateWeek(-1)" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="이전 주차">
            <i class="ph-bold ph-caret-left"></i>
          </button>
          <select 
            v-model="selectedStartDate"
            class="bg-transparent text-gray-700 font-bold outline-none cursor-pointer text-center appearance-none px-4 text-sm min-w-[120px]"
          >
            <option value="">-- 주차 선택 --</option>
            <option v-for="week in filteredWeeks" :key="week.start_date" :value="week.start_date">
              {{ week.month }}월 {{ week.week_number }}주차
            </option>
          </select>
          <button @click="navigateWeek(1)" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="다음 주차">
            <i class="ph-bold ph-caret-right"></i>
          </button>
        </div>

        <button @click="isPlannerOpen = true" class="p-2.5 text-gray-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all active:scale-95" title="연간 주차 셋업">
          <i class="ph-bold ph-gear text-xl"></i>
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="!currentWeekData" class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col items-center justify-center text-center">
      <div class="inline-flex p-4 rounded-full bg-orange-50 mb-4">
        <i class="ph-bold ph-calendar-x text-orange-400 text-4xl"></i>
      </div>
      <p class="text-gray-500 font-bold">주차를 먼저 선택하거나 생성해주세요.</p>
    </div>

    <div v-else class="space-y-4">
      <!-- Desktop Header Row (Hidden on mobile) -->
      <div class="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 bg-white rounded-2xl border border-gray-100 shadow-md text-xs font-black text-gray-400 uppercase tracking-widest sticky top-[64px] z-20">
        <div class="col-span-2">이름</div>
        <div class="col-span-3 text-center">운동 횟수</div>
        <div class="col-span-2 text-center">슈퍼패스</div>
        <div class="col-span-2 text-center">환급 여부</div>
        <div class="col-span-3">비고 (사유)</div>
      </div>

      <!-- Member List -->
      <div v-if="isLoadingRecords" class="flex justify-center p-12">
        <i class="ph-bold ph-spinner animate-spin text-indigo-600 text-4xl"></i>
      </div>
      
      <div v-else class="space-y-3">
        <div v-for="record in memberRecords" :key="record.memberId" 
             class="bg-white p-4 sm:px-6 sm:py-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-4">
          
          <!-- Name -->
          <div class="col-span-2 flex items-center gap-3">
            <span class="font-bold text-gray-900 text-lg">{{ record.name }}</span>
          </div>

          <!-- Counter -->
          <div class="col-span-3 flex items-center lg:justify-center gap-1">
            <span class="lg:hidden text-xs font-black text-gray-400 uppercase w-20">운동 횟수</span>
            <div class="flex items-center bg-gray-50 rounded-xl p-1 shadow-inner border border-gray-100">
              <button @click="record.count > 0 ? record.count-- : null" class="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-500 hover:text-indigo-600 shadow-sm active:scale-95 transition-all">
                <i class="ph-bold ph-minus"></i>
              </button>
              <div class="w-12 text-center font-black text-lg text-gray-800">{{ record.count }}</div>
              <button @click="record.count++" class="w-8 h-8 flex items-center justify-center rounded-lg bg-white text-gray-500 hover:text-indigo-600 shadow-sm active:scale-95 transition-all">
                <i class="ph-bold ph-plus"></i>
              </button>
            </div>
          </div>

          <!-- Superpass Toggle -->
          <div class="col-span-2 flex items-center lg:justify-center gap-4">
            <span class="lg:hidden text-xs font-black text-gray-400 uppercase w-20">슈퍼패스</span>
            <button 
              @click="record.superPass = !record.superPass"
              class="relative block h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none shadow-inner"
              :class="record.superPass ? 'bg-indigo-600' : 'bg-gray-200'"
            >
              <span 
                class="absolute top-1 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-sm ring-0 transition-all duration-200 ease-in-out"
                :class="record.superPass ? 'left-6' : 'left-1'"
              ></span>
            </button>
          </div>

          <!-- Status Badge -->
          <div class="col-span-2 flex items-center lg:justify-center gap-4">
            <span class="lg:hidden text-xs font-black text-gray-400 uppercase w-20">환급 상태</span>
            <span 
              class="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight flex items-center gap-1 shadow-sm"
              :class="getRefundStatus(record).class"
            >
              <i :class="getRefundStatus(record).icon"></i>
              {{ getRefundStatus(record).text }}
            </span>
          </div>

          <!-- Note -->
          <div class="col-span-3 flex items-center gap-4">
            <span class="lg:hidden text-xs font-black text-gray-400 uppercase w-20 shrink-0">비고 (사유)</span>
            <input 
              v-model="record.note" 
              type="text" 
              placeholder="부상, 기타 사유 등" 
              class="w-full bg-gray-50 border border-transparent focus:border-indigo-500 rounded-xl px-4 py-2 outline-none text-sm font-medium text-gray-700 transition-all"
            />
          </div>

        </div>
      </div>
    </div>

    <!-- Fixed Bottom Save Action -->
    <div v-if="currentWeekData" class="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 sm:p-6 z-40 flex justify-center sm:justify-end shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <div class="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 flex justify-end">
        <button 
          @click="saveBatchRecords" 
          :disabled="isSaving" 
          class="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-lg"
        >
          <i v-if="isSaving" class="ph-bold ph-spinner animate-spin"></i>
          <i v-else class="ph-bold ph-check-circle"></i>
          {{ isSaving ? '저장 중...' : '기록 일괄 저장하기' }}
        </button>
      </div>
    </div>

    <!-- Planner Modal -->
    <ModalWeekPlanner 
      :is-open="isPlannerOpen" 
      @close="isPlannerOpen = false" 
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useStore } from '../composables/useStore';
import ModalWeekPlanner from '../components/ModalWeekPlanner.vue';

const { weeks, activeMembers } = useStore();
const isPlannerOpen = ref(false);

const selectedYear = ref(new Date().getFullYear());
const selectedStartDate = ref('');
const memberRecords = ref([]);
const isLoadingRecords = ref(false);
const isSaving = ref(false);

// Filter non-rest weeks and sort
const validWeeks = computed(() => {
  return weeks.value
    .filter(w => Number(w.week_number) !== 0)
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
});

// Year Navigation Logic
const availableYears = computed(() => {
  const years = [...new Set(validWeeks.value.map(w => Number(w.year)))];
  if (years.length === 0) years.push(new Date().getFullYear());
  return years.sort((a, b) => b - a);
});

const navigateYear = (direction) => {
  const years = availableYears.value;
  const currentIndex = years.indexOf(selectedYear.value);
  let nextIndex = currentIndex - direction; 
  if (nextIndex >= 0 && nextIndex < years.length) {
    selectedYear.value = years[nextIndex];
  }
};

// Filtered Weeks based on Selected Year
const filteredWeeks = computed(() => {
  return validWeeks.value.filter(w => Number(w.year) === selectedYear.value);
});

// Week Navigation Logic (Supports Year Crossing)
const navigateWeek = (direction) => {
  const list = validWeeks.value; // Use the global valid list for seamless transition
  const currentIndex = list.findIndex(w => w.start_date === selectedStartDate.value);
  
  // list is desc sorted (newest to oldest), so direction 1 (next/newer) means currentIndex - 1
  let nextIndex = currentIndex - direction; 
  
  if (nextIndex >= 0 && nextIndex < list.length) {
    const targetWeek = list[nextIndex];
    selectedYear.value = Number(targetWeek.year); // Sync Year Selector
    selectedStartDate.value = targetWeek.start_date;
  }
};

const currentWeekData = computed(() => {
  if (!selectedStartDate.value) return null;
  return weeks.value.find(w => w.start_date === selectedStartDate.value) || null;
});

// Initial Selection
onMounted(() => {
  const today = new Date();
  today.setHours(0,0,0,0);
  
  // Try to find current week (must not be a rest week)
  const currentWeek = validWeeks.value.find(w => {
    const start = new Date(w.start_date);
    start.setHours(0,0,0,0);
    const end = new Date(w.end_date);
    end.setHours(23,59,59,999);
    return today >= start && today <= end;
  });

  if (currentWeek) {
    selectedYear.value = Number(currentWeek.year);
    selectedStartDate.value = currentWeek.start_date;
  } else if (validWeeks.value.length > 0) {
    selectedYear.value = Number(validWeeks.value[0].year);
    selectedStartDate.value = validWeeks.value[0].start_date;
  }
});

// Auto-select first week when year changes if current selection is invalid
watch(() => selectedYear.value, (newYear) => {
  if (selectedStartDate.value) {
    const exists = filteredWeeks.value.find(w => w.start_date === selectedStartDate.value);
    if (!exists && filteredWeeks.value.length > 0) {
      selectedStartDate.value = filteredWeeks.value[0].start_date;
    }
  }
});

// Fetch records logic
watch(() => selectedStartDate.value, (newStartStr) => {
  const weekData = currentWeekData.value;
  if (!weekData) {
    memberRecords.value = [];
    return;
  }

  isLoadingRecords.value = true;
  google.script.run
    .withSuccessHandler((res) => {
      isLoadingRecords.value = false;
      const dbRecords = res && res.success ? res.data : [];
      
      memberRecords.value = activeMembers.value.map(member => {
        const existing = dbRecords.find(r => r.member_id === member.id);
        return {
          memberId: member.id,
          name: member.name,
          count: existing ? Number(existing.count) : 0,
          superPass: existing ? (existing.super_pass === true || existing.super_pass === 'TRUE' || existing.super_pass === 'true') : false,
          note: existing ? existing.note : ''
        };
      });
    })
    .withFailureHandler(() => {
      isLoadingRecords.value = false;
      alert('기록을 불러오는데 실패했습니다.');
    })
    .apiGetRecordsByWeek(weekData.year, weekData.month, weekData.week_number);
}, { immediate: true });

const getRefundStatus = (record) => {
  if (record.count >= 3 || (record.count >= 1 && record.superPass)) {
    return { text: '환급 대상', icon: 'ph-fill ph-check-circle', class: 'bg-blue-50 text-blue-600 border border-blue-100' };
  }
  return { text: '환급 불가', icon: 'ph-fill ph-x-circle', class: 'bg-red-50 text-red-500 border border-red-100' };
};

const saveBatchRecords = () => {
  if (!currentWeekData.value) return;
  isSaving.value = true;

  const payload = memberRecords.value.map(record => ({
    memberId: record.memberId,
    year: currentWeekData.value.year,
    month: currentWeekData.value.month,
    weekNumber: currentWeekData.value.week_number,
    count: record.count,
    superPass: record.superPass,
    note: record.note
  }));

  google.script.run
    .withSuccessHandler((res) => {
      isSaving.value = false;
      if (res && res.success) alert('성공적으로 일괄 저장되었습니다.');
      else alert('저장 중 오류가 발생했습니다.');
    })
    .withFailureHandler((err) => {
      isSaving.value = false;
      alert('서버 오류가 발생했습니다.');
    })
    .apiBatchUpdateWorkoutCounts(payload);
};
</script>
