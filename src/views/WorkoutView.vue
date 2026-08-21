<template>
  <div id="workout-page" class="space-y-0 pb-6">
    <!-- Unified Header Section (Sticky) -->
    <div class="sticky top-28 md:top-16 z-30 bg-white">
      <!-- Page Title & Primary Selectors (Indigo Style) -->
      <div class="px-6 py-5 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between bg-indigo-50/30 rounded-t-3xl border-t border-x border-gray-100 gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
            <i class="ph-bold ph-person-simple-run text-xl"></i>
          </div>
          <div class="flex flex-col">
            <h2 class="text-xl font-black text-gray-900 tracking-tight">운동 기록</h2>
            <p v-if="currentWeekData" class="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">
              {{ currentWeekData.year }} · {{ formatMdDate(currentWeekData.start_date) }} ~ {{ formatMdDate(currentWeekData.end_date) }}
            </p>
          </div>
          <button @click="isHeaderExpanded = !isHeaderExpanded" class="md:hidden p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" :title="isHeaderExpanded ? '메뉴 접기' : '메뉴 펼치기'">
            <i class="ph-bold" :class="isHeaderExpanded ? 'ph-caret-up' : 'ph-caret-down'"></i>
          </button>
        </div>

        <div class="flex-wrap items-center gap-2 sm:gap-3" :class="isHeaderExpanded ? 'flex' : 'hidden md:flex'">
          <!-- Search Member -->
          <div class="relative group flex-1 min-w-[140px] sm:flex-none">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="ph-bold ph-magnifying-glass text-gray-400 group-focus-within:text-indigo-500 transition-colors"></i>
            </div>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="멤버 이름 검색"
              class="pl-9 pr-4 py-2 bg-white border border-gray-200 focus:border-indigo-500 rounded-xl outline-none text-sm font-bold text-gray-900 shadow-sm transition-all w-full sm:w-48"
            />
          </div>

          <!-- Status Filter -->
          <select 
            v-model="statusFilter"
            class="px-4 py-2 bg-white border border-gray-200 focus:border-indigo-500 rounded-xl outline-none text-sm font-bold text-gray-700 shadow-sm transition-all cursor-pointer"
          >
            <option value="all">전체 상태</option>
            <option value="eligible">환급 대상</option>
            <option value="incomplete">미달성</option>
          </select>

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

          <!-- Week Selector -->
          <div class="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 shadow-sm transition-all focus-within:border-indigo-500">
            <button @click="navigateWeek('prev')" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="이전 주차">
              <i class="ph-bold ph-caret-left"></i>
            </button>
            <select 
              v-model="selectedWeekId"
              class="bg-transparent text-gray-700 font-bold outline-none cursor-pointer text-center appearance-none px-4 text-sm min-w-[120px]"
            >
              <option value="">-- 주차 선택 --</option>
              <option v-for="week in filteredWeeks" :key="week.id" :value="week.id">
                {{ formatWeekLabel(week) }}
              </option>
            </select>
            <button @click="navigateWeek('next')" class="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors" title="다음 주차">
              <i class="ph-bold ph-caret-right"></i>
            </button>
          </div>

          <button @click="isPlannerOpen = true" class="p-2.5 text-gray-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all active:scale-95 border border-transparent hover:border-indigo-100" title="연간 주차 셋업">
            <i class="ph-bold ph-gear text-xl"></i>
          </button>

          <button @click="takeScreenshot" :disabled="!currentWeekData" class="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50" title="스크린샷 저장">
            <i class="ph-bold ph-camera text-gray-500 text-xl"></i>
          </button>

          <button @click="downloadCsv" :disabled="!currentWeekData" class="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50" title="CSV 다운로드">
            <i class="ph-bold ph-download-simple text-gray-500 text-xl"></i>
          </button>
        </div>
      </div>

      <!-- List Header (Sticky Bottom Part) -->
      <div class="bg-gray-50/95 backdrop-blur-sm pt-4 px-6 pb-3 border-x border-gray-100" :class="isHeaderExpanded ? '' : 'hidden md:block'">
        <!-- Quick Summary Bar -->
        <div v-if="currentWeekData" class="flex flex-wrap items-center gap-2 mb-4 px-2 text-sm font-black tracking-tight">
          <button
            @click="toggleStatusFilter('all')"
            class="px-3 py-1.5 rounded-xl border transition-all active:scale-95 select-none"
            :class="statusFilter === 'all' ? 'bg-gray-800 text-white border-gray-800 shadow-sm' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'"
          >
            총원 {{ summaryCounts.total }}
          </button>
          <button
            @click="toggleStatusFilter('eligible')"
            class="px-3 py-1.5 rounded-xl border transition-all active:scale-95 select-none flex items-center gap-1"
            :class="statusFilter === 'eligible' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-white text-blue-600 border-blue-100 hover:border-blue-300'"
          >
            환급대상 {{ summaryCounts.eligible }}
            <span class="text-[11px] font-bold opacity-75">(목표달성 {{ summaryCounts.targetReached }} / 슈퍼패스 {{ summaryCounts.superPassUsed }})</span>
          </button>
          <button
            @click="toggleStatusFilter('incomplete')"
            class="px-3 py-1.5 rounded-xl border transition-all active:scale-95 select-none"
            :class="statusFilter === 'incomplete' ? 'bg-red-500 text-white border-red-500 shadow-sm' : 'bg-white text-red-500 border-red-100 hover:border-red-300'"
          >
            미달성 {{ summaryCounts.incomplete }}
          </button>
        </div>

        <div class="hidden lg:grid grid-cols-12 gap-4 px-8 py-3 bg-gray-100 rounded-xl text-[11px] font-black text-gray-400 uppercase tracking-widest shadow-sm border border-gray-200">
          <div class="col-span-2">이름</div>
          <div class="col-span-3 text-center">운동 횟수</div>
          <div class="col-span-2 text-center">슈퍼패스</div>
          <div class="col-span-2 text-center">환급 상태</div>
          <div class="col-span-3">메모</div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div v-if="!currentWeekData" class="bg-gray-50/50 border-x border-b border-gray-100 rounded-b-3xl p-20 flex flex-col items-center justify-center text-center">
      <div class="inline-flex p-5 rounded-full bg-white shadow-sm border border-gray-100 mb-4">
        <i class="ph-bold ph-calendar-x text-orange-400 text-5xl"></i>
      </div>
      <p class="text-gray-400 font-black text-lg">주차를 먼저 선택하거나 생성해주세요.</p>
    </div>

    <div v-else-if="isRestWeek(currentWeekData)" class="bg-gray-50/50 border-x border-b border-gray-100 rounded-b-3xl p-20 flex flex-col items-center justify-center text-center">
      <div class="inline-flex p-5 rounded-full bg-white shadow-sm border border-gray-100 mb-4">
        <i class="ph-bold ph-coffee text-indigo-400 text-5xl"></i>
      </div>
      <p class="text-gray-400 font-black text-lg">이번 주는 휴식주간입니다.</p>
      <p class="text-gray-400 text-sm mt-2">운동 기록을 추가하거나 수정할 수 없습니다.</p>
    </div>

    <div v-else id="workout-capture-area" class="bg-gray-50/50 border-x border-b border-gray-100 rounded-b-3xl overflow-hidden min-h-[400px]">
      <div class="px-6 pb-6 space-y-3 pt-1">
        <div v-for="record in memberRecords" :key="record.memberId" 
             @click="openLogModal(record.memberId)"
             class="bg-white p-5 md:px-8 md:py-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-4">
          
          <!-- Name -->
          <div class="lg:col-span-2 flex items-center gap-3">
            <span class="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{{ record.name }}</span>
          </div>

          <!-- Counter -->
          <div class="lg:col-span-3 flex items-center lg:justify-center gap-2">
            <span class="lg:hidden text-[10px] font-black text-gray-400 uppercase w-20 shrink-0">운동 횟수</span>
            <div class="flex items-center bg-gray-50 rounded-xl px-4 py-2 shadow-inner border border-gray-100">
              <div class="text-center font-black text-lg text-gray-800">{{ record.count }}회</div>
            </div>
          </div>

          <!-- Superpass -->
          <div class="lg:col-span-2 flex items-center lg:justify-center gap-2">
            <span class="lg:hidden text-[10px] font-black text-gray-400 uppercase w-20 shrink-0">슈퍼패스</span>
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

          <!-- Status -->
          <div class="lg:col-span-2 flex items-center lg:justify-center gap-2">
            <span class="lg:hidden text-[10px] font-black text-gray-400 uppercase w-20 shrink-0">환급 상태</span>
            <span 
              class="px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-tight flex items-center gap-1 shadow-sm border"
              :class="getRefundStatus(record).class"
            >
              <i :class="getRefundStatus(record).icon"></i>
              {{ getRefundStatus(record).text }}
            </span>
          </div>

          <!-- Note -->
          <div class="lg:col-span-3 flex items-center gap-2">
            <span class="lg:hidden text-[10px] font-black text-gray-400 uppercase w-20 shrink-0">메모</span>
            <span class="text-sm font-medium text-gray-600 truncate ">{{ record.note || '-' }}</span>
            <i class="ph-bold ph-caret-right text-gray-300 lg:hidden ml-auto"></i>
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
import { isRestWeek, formatWeekLabel, formatWeekNumberLabel } from '../composables/weekUtils';
import { useScreenshot } from '../composables/useScreenshot';
import { useHeaderCollapse } from '../composables/useHeaderCollapse';
import ModalWeekPlanner from '../components/ModalWeekPlanner.vue';
import ModalWorkoutLog from '../components/ModalWorkoutLog.vue';
import { downloadCsvFile } from '../composables/useCsv';

const { weeks, activeMembers, membersOfWeek, workoutRecords, selectedWeekId } = useStore();
const { confirm, alert } = useDialog();
const isPlannerOpen = ref(false);

const selectedYear = ref(new Date().getFullYear());
const { isHeaderExpanded } = useHeaderCollapse('workout');
const searchQuery = ref('');
const statusFilter = ref('all'); // all, eligible, incomplete
let isNavigating = false; // suppresses the year watcher during programmatic week navigation

const isLogModalOpen = ref(false);
const selectedMemberId = ref(null);

const validWeeks = computed(() => {
  return [...weeks.value]
    .sort((a, b) => new Date(b.start_date) - new Date(a.start_date));
});

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

const filteredWeeks = computed(() => {
  return validWeeks.value.filter(w => Number(w.year) === selectedYear.value);
});

const navigateWeek = async (directionStr) => {
  const list = validWeeks.value;
  const currentIndex = list.findIndex(w => w.id === selectedWeekId.value);
  
  if (currentIndex === -1) {
    if (list.length > 0) {
      selectedYear.value = Number(list[0].year);
      await nextTick();
      selectedWeekId.value = list[0].id;
    }
    return;
  }
  
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
      selectedYear.value = Number(targetWeek.year);
      await nextTick();
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

const memberRecords = computed(() => {
  const weekData = currentWeekData.value;
  if (!weekData) return [];

  const dbRecords = workoutRecords.value.filter(r => 
    String(r.year) === String(weekData.year) &&
    String(r.month) === String(weekData.month) &&
    String(r.week_number) === String(weekData.week_number)
  );
  
  return membersOfWeek(weekData)
    .map(member => {
      const existing = dbRecords.find(r => r.member_id === member.id);
      return {
        memberId: member.id,
        name: member.name,
        count: existing ? Number(existing.count) : 0,
        superPass: existing ? (existing.super_pass === true || String(existing.super_pass).toUpperCase() === 'TRUE') : false,
        note: existing ? existing.note : ''
      };
    })
    .filter(record => {
      if (searchQuery.value.trim() && !record.name.toLowerCase().includes(searchQuery.value.toLowerCase().trim())) {
        return false;
      }
      
      const isEligible = record.count >= 3 || (record.count >= 1 && record.superPass);
      if (statusFilter.value === 'eligible' && !isEligible) return false;
      if (statusFilter.value === 'incomplete' && isEligible) return false;

      return true;
    });
});

const summaryCounts = computed(() => {
  const weekData = currentWeekData.value;
  if (!weekData) return { total: 0, eligible: 0, incomplete: 0, targetReached: 0, superPassUsed: 0 };

  const dbRecords = workoutRecords.value.filter(r => 
    String(r.year) === String(weekData.year) &&
    String(r.month) === String(weekData.month) &&
    String(r.week_number) === String(weekData.week_number)
  );

  const stats = membersOfWeek(weekData).reduce((acc, m) => {
    const existing = dbRecords.find(r => r.member_id === m.id);
    const count = existing ? Number(existing.count) : 0;
    const sp = existing ? (existing.super_pass === true || String(existing.super_pass).toUpperCase() === 'TRUE') : false;
    
    acc.total++;
    if (count >= 3 || (count >= 1 && sp)) {
      acc.eligible++;
      if (count >= 3) acc.targetReached++;
      else acc.superPassUsed++;
    } else {
      acc.incomplete++;
    }
    
    return acc;
  }, { total: 0, eligible: 0, incomplete: 0, targetReached: 0, superPassUsed: 0 });

  return stats;
});

// Summary-bar chips are a single-select toggle; re-clicking the active chip resets to 'all'
const toggleStatusFilter = (value) => {
  statusFilter.value = statusFilter.value === value ? 'all' : value;
};

const toggleSuperPass = async (record) => {
  const newValue = !record.superPass;
  const weekData = currentWeekData.value;

  if (newValue) {
    const alreadyUsed = workoutRecords.value.find(r => 
      r.member_id === record.memberId &&
      String(r.year) === String(weekData.year) &&
      String(r.month) === String(weekData.month) &&
      String(r.week_number) !== String(weekData.week_number) &&
      (r.super_pass === true || String(r.super_pass).toUpperCase() === 'TRUE')
    );
    if (alreadyUsed) {
      await alert({ title: '사용 불가', message: `해당 멤버는 이미 ${weekData.month}-${alreadyUsed.week_number}주차에 슈퍼패스를 사용했습니다.`, isDanger: true });
      return;
    }
  }

  const confirmResult = await confirm({
    title: '슈퍼패스 상태 변경',
    message: record.superPass ? '슈퍼패스 사용을 취소하시겠습니까?' : '슈퍼패스를 사용 처리하시겠습니까?',
    confirmText: '변경',
    cancelText: '닫기'
  });
  if (!confirmResult) return;

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
      member_id: record.memberId, year: weekData.year, month: weekData.month,
      week_number: weekData.week_number, count: 0, super_pass: newValue, note: ''
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
    .withFailureHandler((err) => {
      console.error('Superpass toggle failed:', err);
      workoutRecords.value = prevRecords;
      alert({ title: '오류', message: '서버 요청 중 오류가 발생했습니다.', isDanger: true });
    })
    .apiUpdateWorkoutCount(record.memberId, weekData.year, weekData.month, weekData.week_number, actualDbRecord.count, newValue, actualDbRecord.note);
};

const setInitialWeek = async () => {
  if (validWeeks.value.length === 0) return;

  // Week selection is shared with the dashboard, so the year selector must follow it across years
  // Keep it only while the week still exists — planner saves can drop rows and strand a dangling id
  const shared = validWeeks.value.find(w => w.id === selectedWeekId.value);
  if (shared) {
    if (selectedYear.value !== Number(shared.year)) {
      selectedYear.value = Number(shared.year);
      await nextTick();
      selectedWeekId.value = shared.id;
    }
    return;
  }

  const today = new Date();
  today.setHours(0,0,0,0);
  const pad = n => n < 10 ? '0'+n : n;
  const todayStr = `${today.getFullYear()}-${pad(today.getMonth()+1)}-${pad(today.getDate())}`;
  
  const currentWeek = validWeeks.value.find(w => {
    const start = w.start_date.split(' ')[0].split('T')[0];
    const end = w.end_date.split(' ')[0].split('T')[0];
    return todayStr >= start && todayStr <= end;
  });

  if (currentWeek) {
    selectedYear.value = Number(currentWeek.year);
    await nextTick();
    selectedWeekId.value = currentWeek.id;
  } else {
    selectedYear.value = Number(validWeeks.value[0].year);
    await nextTick();
    selectedWeekId.value = validWeeks.value[0].id;
  }
};

onMounted(() => {
  setInitialWeek();
});

watch(weeks, () => {
  setInitialWeek();
}, { immediate: true });

watch(() => selectedYear.value, (newYear) => {
  if (isNavigating) return;
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

const { captureElement } = useScreenshot();
const takeScreenshot = () => {
  if (!currentWeekData.value) return;
  captureElement(
    [{ id: 'gnb-capture', bg: '#ffffff' }, { id: 'workout-page' }],
    `jsog_workouts_${formatWeekLabel(currentWeekData.value).replace(/ /g, '_')}.png`
  );
};

const downloadCsv = () => {
  if (!currentWeekData.value) return;
  const data = memberRecords.value;
  const week = currentWeekData.value;
  const headers = ['이름', '운동횟수', '슈퍼패스', '환급상태', '메모'];
  const rows = data.map(r => [r.name, r.count, r.superPass ? '사용' : '-', getRefundStatus(r).text, r.note || '']);
  const weekLabel = formatWeekNumberLabel(week);
  const fileWeekLabel = isRestWeek(week) ? '휴식주간' : `W${week.week_number}`;

  downloadCsvFile(
    `workout_report_${week.year}_${week.month}_${fileWeekLabel}.csv`,
    headers,
    rows,
    [`주차: ${week.year}년 ${week.month}월 ${weekLabel} (${week.start_date} ~ ${week.end_date})`]
  );
};

const formatMdDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? dateStr : `${date.getMonth() + 1}/${date.getDate()}`;
};
</script>
