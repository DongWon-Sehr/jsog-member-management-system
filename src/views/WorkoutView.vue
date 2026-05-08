<template>
  <div class="space-y-6 pb-6">
    <!-- Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
      <div class="flex flex-col">
        <h2 class="text-2xl font-bold text-gray-800">운동 기록</h2>
        <div v-if="currentWeekData" class="mt-1">
          <p class="text-lg font-bold text-indigo-600 leading-tight">{{ currentWeekData.year }}</p>
          <p class="text-sm font-medium text-gray-500">
            {{ formatMdDate(currentWeekData.start_date) }} ~ {{ formatMdDate(currentWeekData.end_date) }}
          </p>
        </div>
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
          <button @click="navigateWeek('prev')" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="이전 주차 (과거)">
            <i class="ph-bold ph-caret-left"></i>
          </button>
          <select 
            v-model="selectedWeekId"
            class="bg-transparent text-gray-700 font-bold outline-none cursor-pointer text-center appearance-none px-4 text-sm min-w-[120px]"
          >
            <option value="">-- 주차 선택 --</option>
            <option v-for="week in filteredWeeks" :key="week.id" :value="week.id">
              {{ week.month }}월 {{ week.week_number }}주차
            </option>
          </select>
          <button @click="navigateWeek('next')" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="다음 주차 (미래)">
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
        <div class="col-span-3">메모</div>
      </div>

      <!-- Member List -->
      <div class="space-y-3">
        <div v-for="record in memberRecords" :key="record.memberId" 
             @click="openLogModal(record.memberId)"
             class="bg-white p-4 sm:px-6 sm:py-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-4 cursor-pointer hover:shadow-md">
          
          <!-- Name -->
          <div class="col-span-2 flex items-center gap-3">
            <span class="font-bold text-gray-900 text-lg">{{ record.name }}</span>
          </div>

          <!-- Counter (Read-only) -->
          <div class="col-span-3 flex items-center lg:justify-center gap-1">
            <span class="lg:hidden text-xs font-black text-gray-400 uppercase w-20">운동 횟수</span>
            <div class="flex items-center bg-gray-50 rounded-xl p-2 px-4 shadow-inner border border-gray-100">
              <div class="text-center font-black text-lg text-gray-800">{{ record.count }}회</div>
            </div>
          </div>

          <!-- Superpass Toggle -->
          <div class="col-span-2 flex items-center lg:justify-center gap-4">
            <span class="lg:hidden text-xs font-black text-gray-400 uppercase w-20">슈퍼패스</span>
            <button 
              @click.stop="toggleSuperPass(record)"
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

          <!-- Note (Read-only preview) -->
          <div class="col-span-3 flex items-center gap-4">
            <span class="lg:hidden text-xs font-black text-gray-400 uppercase w-20 shrink-0">메모</span>
            <span class="text-sm font-medium text-gray-600 truncate">{{ record.note || '-' }}</span>
          </div>

        </div>
      </div>
    </div>

    <!-- Planner Modal -->
    <ModalWeekPlanner 
      :is-open="isPlannerOpen" 
      @close="isPlannerOpen = false" 
    />

    <!-- Workout Log Modal -->
    <ModalWorkoutLog 
      v-if="isLogModalOpen"
      :is-open="isLogModalOpen"
      :member-id="selectedMemberId"
      :week-data="currentWeekData"
      @close="isLogModalOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
import { useStore } from '../composables/useStore';
import { useDialog } from '../composables/useDialog';
import ModalWeekPlanner from '../components/ModalWeekPlanner.vue';
import ModalWorkoutLog from '../components/ModalWorkoutLog.vue';

const { weeks, activeMembers, workoutRecords } = useStore();
const { confirm, alert } = useDialog();
const isPlannerOpen = ref(false);

const selectedYear = ref(new Date().getFullYear());
const selectedWeekId = ref('');
let isNavigating = false; // Flag to prevent watcher interference

// Log Modal state
const isLogModalOpen = ref(false);
const selectedMemberId = ref(null);

// Filter non-rest weeks and sort
const validWeeks = computed(() => {
  return weeks.value
    .filter(w => Number(w.week_number) !== 0)
    .sort((a, b) => {
      if (Number(b.year) !== Number(a.year)) return Number(b.year) - Number(a.year);
      if (Number(b.month) !== Number(a.month)) return Number(b.month) - Number(a.month);
      return Number(b.week_number) - Number(a.week_number);
    });
});

const isPrevWeekDisabled = computed(() => {
  if (!selectedWeekId.value) return true;
  const list = validWeeks.value;
  const currentIndex = list.findIndex(w => w.id === selectedWeekId.value);
  return currentIndex === -1 || currentIndex === list.length - 1;
});

const isNextWeekDisabled = computed(() => {
  if (!selectedWeekId.value) return true;
  const list = validWeeks.value;
  const currentIndex = list.findIndex(w => w.id === selectedWeekId.value);
  return currentIndex <= 0;
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
const navigateWeek = async (directionStr) => {
  const list = validWeeks.value; // Use the global valid list for seamless transition
  const currentIndex = list.findIndex(w => w.id === selectedWeekId.value);
  
  if (currentIndex === -1) {
    if (list.length > 0) {
      selectedYear.value = Number(list[0].year);
      await nextTick();
      selectedWeekId.value = list[0].id;
    }
    return;
  }
  
  // list is desc sorted (newest to oldest)
  // 'prev' (Left/Past): go to older (higher index)
  // 'next' (Right/Future): go to newer (lower index)
  let nextIndex = currentIndex;
  if (directionStr === 'prev') {
    nextIndex = currentIndex + 1;
  } else if (directionStr === 'next') {
    nextIndex = currentIndex - 1;
  }
  
  if (nextIndex >= 0 && nextIndex < list.length) {
    isNavigating = true;
    const targetWeek = list[nextIndex];
    
    if (selectedYear.value !== Number(targetWeek.year)) {
      selectedYear.value = Number(targetWeek.year); // Sync Year Selector
      await nextTick(); // Wait for filteredWeeks and DOM to update options
    }
    
    selectedWeekId.value = targetWeek.id;
    await nextTick();
    isNavigating = false;
  }
};

const currentWeekData = computed(() => {
  if (!selectedWeekId.value) return null;
  return weeks.value.find(w => w.id === selectedWeekId.value) || null;
});

// Calculate Member Records on the fly using store data
const memberRecords = computed(() => {
  const weekData = currentWeekData.value;
  if (!weekData) return [];

  // Filter records for the selected week
  const dbRecords = workoutRecords.value.filter(r => 
    String(r.year) === String(weekData.year) &&
    String(r.month) === String(weekData.month) &&
    String(r.week_number) === String(weekData.week_number)
  );
  
  return activeMembers.value.map(member => {
    const existing = dbRecords.find(r => r.member_id === member.id);
    return {
      memberId: member.id,
      name: member.name,
      count: existing ? Number(existing.count) : 0,
      superPass: existing ? (existing.super_pass === true || existing.super_pass === 'TRUE' || existing.super_pass === 'true') : false,
      note: existing ? existing.note : ''
    };
  });
});

const toggleSuperPass = async (record) => {
  const confirmResult = await confirm({
    title: '슈퍼패스 상태 변경',
    message: record.superPass ? '슈퍼패스 사용을 취소하시겠습니까?' : '슈퍼패스를 사용 처리하시겠습니까?',
    confirmText: '변경',
    cancelText: '취소'
  });
  if (!confirmResult) return;

  const newValue = !record.superPass;
  const weekData = currentWeekData.value;
  
  // Optimistic update in global store
  const dbRecordIndex = workoutRecords.value.findIndex(r => 
    r.member_id === record.memberId &&
    String(r.year) === String(weekData.year) &&
    String(r.month) === String(weekData.month) &&
    String(r.week_number) === String(weekData.week_number)
  );

  const prevRecords = JSON.parse(JSON.stringify(workoutRecords.value));

  if (dbRecordIndex > -1) {
    workoutRecords.value[dbRecordIndex].super_pass = newValue;
  } else {
    workoutRecords.value.push({
      member_id: record.memberId,
      year: weekData.year,
      month: weekData.month,
      week_number: weekData.week_number,
      count: 0,
      super_pass: newValue,
      note: ''
    });
  }

  const actualDbRecord = workoutRecords.value.find(r => 
    r.member_id === record.memberId &&
    String(r.year) === String(weekData.year) &&
    String(r.month) === String(weekData.month) &&
    String(r.week_number) === String(weekData.week_number)
  );

  google.script.run
    .withSuccessHandler((res) => {
      if (!res || !res.success) {
        workoutRecords.value = prevRecords;
        alert({ title: '오류', message: '저장에 실패했습니다.', isDanger: true });
      }
    })
    .withFailureHandler(() => {
      workoutRecords.value = prevRecords;
      alert({ title: '오류', message: '서버 요청 중 오류가 발생했습니다.', isDanger: true });
    })
    .apiUpdateWorkoutCount(
      record.memberId, 
      weekData.year, 
      weekData.month, 
      weekData.week_number, 
      actualDbRecord.count, 
      newValue, 
      actualDbRecord.note
    );
};

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
    selectedWeekId.value = currentWeek.id;
  } else if (validWeeks.value.length > 0) {
    selectedYear.value = Number(validWeeks.value[0].year);
    selectedWeekId.value = validWeeks.value[0].id;
  }
});

// Auto-select first week when year changes if current selection is invalid
watch(() => selectedYear.value, (newYear) => {
  if (isNavigating) return; // Skip auto-selection if we are navigating via arrows
  if (selectedWeekId.value) {
    const exists = filteredWeeks.value.find(w => w.id === selectedWeekId.value);
    if (!exists && filteredWeeks.value.length > 0) {
      selectedWeekId.value = filteredWeeks.value[0].id;
    }
  }
});

const getRefundStatus = (record) => {
  if (record.count >= 3 || (record.count >= 1 && record.superPass)) {
    return { text: '환급 대상', icon: 'ph-fill ph-check-circle', class: 'bg-blue-50 text-blue-600 border border-blue-100' };
  }
  return { text: '환급 불가', icon: 'ph-fill ph-x-circle', class: 'bg-red-50 text-red-500 border border-red-100' };
};

const openLogModal = (memberId) => {
  selectedMemberId.value = memberId;
  isLogModalOpen.value = true;
};

const formatMdDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${date.getMonth() + 1}/${date.getDate()}`;
};
</script>
