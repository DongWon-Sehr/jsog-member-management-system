<template>
  <Teleport to="body">
    <transition name="modal">
      <div v-if="isOpen" class="fixed inset-0 z-[100] overflow-hidden flex items-center justify-center backdrop-blur-sm bg-black/40 p-4 sm:p-0">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col transform transition-all border border-gray-100 relative">
          
          <!-- Saving Overlay -->
          <div v-if="isSaving" class="absolute inset-0 z-50 bg-white/50 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center cursor-wait">
            <i class="ph-bold ph-spinner animate-spin text-indigo-600 text-5xl mb-4 shadow-sm rounded-full bg-white"></i>
            <span class="text-indigo-800 font-black text-lg bg-white px-4 py-1 rounded-full shadow-sm border border-indigo-50">저장 중입니다...</span>
          </div>

          <!-- Header -->
          <div class="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-indigo-50/30 rounded-t-3xl">
            <div class="flex items-center gap-4">
              <h3 class="text-xl font-black text-gray-900 flex items-center gap-2">
                <i class="ph-bold ph-calendar-blank text-indigo-600"></i>
                연간 주차 플래너
              </h3>
              <!-- Year Selector -->
              <div class="flex items-center gap-1 bg-white border-2 border-indigo-100 rounded-xl p-1 shadow-sm transition-all focus-within:border-indigo-500">
                <button @click="selectedYear > availableYears[0] ? selectedYear-- : null" class="p-1 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" :disabled="selectedYear <= availableYears[0]">
                  <i class="ph-bold ph-caret-left"></i>
                </button>
                <select v-model="selectedYear" class="bg-transparent text-indigo-700 font-bold outline-none cursor-pointer text-center appearance-none px-2">
                  <option v-for="y in availableYears" :key="y" :value="y">{{ y }}년</option>
                </select>
                <button @click="selectedYear < availableYears[availableYears.length - 1] ? selectedYear++ : null" class="p-1 text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed" :disabled="selectedYear >= availableYears[availableYears.length - 1]">
                  <i class="ph-bold ph-caret-right"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Body / Matrix -->
          <div class="flex-1 overflow-y-auto bg-gray-50/50 relative">
            <!-- Table Header (Sticky Wrapper) -->
            <div class="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm pt-6 px-6 pb-3">
              <div class="hidden sm:grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 rounded-xl text-[11px] font-black text-gray-500 uppercase tracking-widest shadow-sm border border-gray-200">
                <div class="col-span-4">기간 (월 ~ 일)</div>
                <div class="col-span-2 text-center">휴식 여부</div>
                <div class="col-span-2 text-center">기준 연도</div>
                <div class="col-span-2 text-center">지정 월</div>
                <div class="col-span-2 text-center">지정 주차</div>
              </div>
            </div>

            <!-- Matrix Rows -->
            <div class="px-6 pb-6 space-y-3">
              <div v-for="(row, index) in plannerMatrix" :key="row.start_date" 
                   class="bg-white p-4 sm:px-4 sm:py-3 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-indigo-200 relative z-0"
                   :class="{ 'opacity-70 bg-gray-50': row.is_rest_week }">
                
                <div class="flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-4 sm:gap-4">
                  <!-- Date Range -->
                  <div class="col-span-4 flex items-center">
                    <span class="font-mono text-sm font-bold text-gray-700 tracking-tight">
                      {{ formatDateShort(row.start_date) }} ~ {{ formatDateShort(row.end_date) }}
                    </span>
                  </div>

                  <!-- Duplicate label warning -->
                  <div v-if="!row.is_rest_week && duplicateLabels.has(labelKey(row))" class="col-span-12 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl order-last">
                    <i class="ph-fill ph-warning-circle text-red-500"></i>
                    <span class="text-xs font-bold text-red-600">{{ row.year }}년 {{ row.month }}월 {{ row.week_number }}주차가 다른 주와 중복됩니다.</span>
                  </div>

                  <!-- Rest Week Checkbox -->
                  <div class="col-span-2 flex items-center sm:justify-center">
                    <label class="flex items-center gap-2 cursor-pointer group">
                      <div class="relative flex items-center justify-center w-5 h-5">
                        <input
                          v-model="row.is_rest_week"
                          @change="handleRestWeekChange(row)"
                          type="checkbox" 
                          class="peer w-full h-full m-0 cursor-pointer appearance-none rounded border-2 border-gray-300 checked:bg-indigo-600 checked:border-indigo-600 transition-all"
                        />
                        <i class="ph-bold ph-check absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-[10px]"></i>
                      </div>
                      <span class="text-sm font-bold text-gray-500 sm:hidden">휴식 주간</span>
                    </label>
                  </div>

                  <!-- Year and month stay editable on a rest week: the dashboard still labels it
                       as "N월 휴식주간", and a week straddling two months needs a manual call. -->
                  <div class="col-span-2">
                    <div class="sm:hidden text-[10px] font-black text-gray-400 uppercase mb-1">기준 연도</div>
                    <input v-model.number="row.year" type="number" class="w-full text-center py-2 bg-gray-50 border border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-gray-700 transition-all" />
                  </div>
                  <div class="col-span-2">
                    <div class="sm:hidden text-[10px] font-black text-gray-400 uppercase mb-1">지정 월</div>
                    <div class="relative">
                      <input v-model.number="row.month" type="number" min="1" max="12" class="w-full text-center py-2 bg-gray-50 border border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-gray-700 transition-all pr-4" />
                      <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <span class="text-xs text-gray-400 font-bold">월</span>
                      </div>
                    </div>
                  </div>

                  <!-- Only the workout week number is withheld on a rest week -->
                  <div v-if="row.is_rest_week" class="col-span-2 flex items-center justify-center py-2 bg-gray-100 rounded-xl shadow-inner">
                    <span class="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                      <i class="ph-fill ph-coffee"></i> 휴식
                    </span>
                  </div>
                  <div v-else class="col-span-2">
                    <div class="sm:hidden text-[10px] font-black text-gray-400 uppercase mb-1">지정 주차</div>
                    <div class="relative">
                      <input v-model.number="row.week_number" type="number" min="1" max="6"
                             class="w-full text-center py-2 border rounded-xl outline-none font-black transition-all pr-6 shadow-inner"
                             :class="duplicateLabels.has(labelKey(row)) ? 'bg-red-50 border-red-300 text-red-600 focus:border-red-500' : 'bg-indigo-50 border-transparent text-indigo-700 focus:border-indigo-500'" />
                      <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                        <span class="text-[10px] font-black" :class="duplicateLabels.has(labelKey(row)) ? 'text-red-400' : 'text-indigo-400'">주차</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="px-6 py-5 border-t border-gray-50 bg-white rounded-b-3xl flex items-center justify-end gap-3 shrink-0">
            <div v-if="hasBlockingIssue" class="mr-auto flex items-center gap-2 text-red-600">
              <i class="ph-fill ph-warning-circle"></i>
              <span class="text-xs font-bold">주차 번호가 중복되거나 비어 있어 저장할 수 없습니다.</span>
            </div>
            <button @click="close" class="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-black shadow-sm hover:bg-gray-50 transition-all active:scale-95">닫기</button>
            <button @click="saveBatch" :disabled="isSaving || hasBlockingIssue" class="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
              <i v-if="isSaving" class="ph-bold ph-spinner animate-spin"></i>
              {{ isSaving ? '저장 중...' : '일괄 저장하기' }}
            </button>
          </div>

        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { toRef } from 'vue';
import { useScrollLock } from '../composables/useScrollLock';
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from '../composables/useStore';
import { useDialog } from '../composables/useDialog';
import { isRestWeek } from '../composables/weekUtils';

const props = defineProps({
  isOpen: Boolean
});

useScrollLock(toRef(props, 'isOpen'));

const emit = defineEmits(['close']);
const { weeks } = useStore();
const { alert } = useDialog();

const isSaving = ref(false);

const handleEsc = (e) => {
  if (e.key === 'Escape' && props.isOpen && !isSaving.value) close();
};

onMounted(() => window.addEventListener('keydown', handleEsc));
onUnmounted(() => window.removeEventListener('keydown', handleEsc));

// Year Selection setup
const currentYear = new Date().getFullYear();
const availableYears = [];
for (let y = 2024; y <= currentYear + 1; y++) {
  availableYears.push(y);
}
const selectedYear = ref(currentYear);

// The main matrix state
const plannerMatrix = ref([]);

// Format Helper
const formatDateFull = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatDateShort = (dateStr) => {
  const [, m, d] = dateStr.split('-');
  return `${m}.${d}`;
};

// The (year, month, week_number) label is the join key for workout_records, so it has to be
// unique - but only among workout weeks. Rest weeks are excluded: they hold no records and their
// week_number is just a preserved value.
const labelKey = (row) => `${row.year}-${row.month}-${row.week_number}`;

const duplicateLabels = computed(() => {
  const seen = new Set();
  const duplicates = new Set();

  plannerMatrix.value.forEach(row => {
    if (row.is_rest_week) return;
    const key = labelKey(row);
    if (seen.has(key)) duplicates.add(key);
    else seen.add(key);
  });

  return duplicates;
});

const unnumberedRows = computed(() =>
  plannerMatrix.value.filter(row => !row.is_rest_week && !(Number(row.week_number) > 0))
);

const hasBlockingIssue = computed(() => duplicateLabels.value.size > 0 || unnumberedRows.value.length > 0);

// Smallest week number not yet taken within the same (year, month)
const nextFreeWeekNumber = (rows, target) => {
  const taken = new Set(
    rows
      .filter(row => row !== target && !row.is_rest_week && Number(row.year) === Number(target.year) && Number(row.month) === Number(target.month))
      .map(row => Number(row.week_number))
  );

  let candidate = 1;
  while (taken.has(candidate)) candidate++;
  return candidate;
};

// Generate Matrix Logic
const generateMatrix = (year) => {
  const matrix = [];

  // 1. Find Jan 1st
  const jan1 = new Date(year, 0, 1);

  // 2. Find the Monday before or on Jan 1st
  let dayOfWeek = jan1.getDay(); // 0 is Sunday, 1 is Monday
  let diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const startDate = new Date(jan1);
  startDate.setDate(startDate.getDate() - diffToMonday);

  // 3. Loop by adding 7 days until we hit Jan 1st of the next year
  const nextYearJan1 = new Date(year + 1, 0, 1);

  let currentStart = new Date(startDate);

  while (currentStart < nextYearJan1) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6);

    const startStr = formatDateFull(currentStart);
    const endStr = formatDateFull(currentEnd);

    // Check if we have an existing record in the DB for this start_date
    const existingRecord = weeks.value.find(w => {
      if (!w.start_date) return false;
      // Handle standardized date (YYYY-MM-DD) or datetime (YYYY-MM-DD HH:mm:ss)
      const dbStart = String(w.start_date).split(' ')[0].split('T')[0];
      return dbStart === startStr;
    });

    // Thursday decides which month a week leans towards by default; the admin overrides it
    // whenever a week straddling two months belongs to the other one.
    const thursday = new Date(currentStart);
    thursday.setDate(thursday.getDate() + 3);

    if (existingRecord) {
      // Use DB data
      matrix.push({
        id: existingRecord.id, // Keep ID for updates
        start_date: startStr,
        end_date: endStr,
        year: Number(existingRecord.year),
        month: Number(existingRecord.month),
        week_number: Number(existingRecord.week_number) || 0,
        is_rest_week: isRestWeek(existingRecord),
        needsDefaultNumber: false
      });
    } else {
      matrix.push({
        start_date: startStr,
        end_date: endStr,
        year: thursday.getFullYear(),
        month: thursday.getMonth() + 1,
        week_number: 0,
        is_rest_week: false,
        // Numbered in a second pass, once the weeks already saved for that month are known
        needsDefaultNumber: true
      });
    }

    // Move to next week
    currentStart.setDate(currentStart.getDate() + 7);
  }

  matrix.forEach(row => {
    if (!row.needsDefaultNumber) return;
    row.week_number = nextFreeWeekNumber(matrix, row);
    row.needsDefaultNumber = false;
  });

  plannerMatrix.value = matrix;
};

// Handle Rest Week Toggle
const handleRestWeekChange = (row) => {
  // The number is deliberately kept while the week is marked as rest, so unchecking restores the
  // admin's original choice instead of resetting to a guess. A number is only invented when the
  // row never had one (0 = never assigned, e.g. rows migrated from the old schema).
  if (!row.is_rest_week && !(Number(row.week_number) > 0)) {
    row.week_number = nextFreeWeekNumber(plannerMatrix.value, row);
  }
};

// Watch for year change or modal open to regenerate
watch(() => selectedYear.value, (newYear) => {
  if (props.isOpen) generateMatrix(newYear);
});

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    generateMatrix(selectedYear.value);
  }
});

// Save Logic
const close = () => {
  emit('close');
};

const saveBatch = async () => {
  if (duplicateLabels.value.size > 0) {
    await alert({
      title: '주차 번호 중복',
      message: `같은 연도·월에 동일한 주차 번호가 지정된 주가 있습니다: ${[...duplicateLabels.value].join(', ')}\n운동 기록이 어느 주차의 것인지 구분할 수 없으므로 먼저 수정해주세요.`,
      isDanger: true
    });
    return;
  }

  if (unnumberedRows.value.length > 0) {
    await alert({
      title: '주차 번호 누락',
      message: `주차 번호가 지정되지 않은 운동주간이 ${unnumberedRows.value.length}개 있습니다. (${unnumberedRows.value[0].start_date} 등)\n휴식주간으로 두거나 번호를 입력해주세요.`,
      isDanger: true
    });
    return;
  }

  isSaving.value = true;

  // Prepare payload. A rest week keeps its week_number so the choice survives a rest toggle;
  // the server ignores it for lookups because is_rest_week is what marks the week.
  const payload = plannerMatrix.value.map(row => ({
    year: row.year,
    month: row.month,
    week_number: Number(row.week_number) > 0 ? Number(row.week_number) : 0,
    start_date: row.start_date,
    end_date: row.end_date,
    is_rest_week: !!row.is_rest_week
  }));

  google.script.run
    .withSuccessHandler((res) => {
      if (res && res.success) {
        // Refresh local store data blindly to reflect new truths
        google.script.run
          .withSuccessHandler(r => {
            isSaving.value = false;
            if (r.success) {
              weeks.value = r.data;
              // Rebuild from what the server actually stored, so a rejected or adjusted row is
              // visible here instead of only living in local state. Modal remains open.
              generateMatrix(selectedYear.value);
            }
          })
          .withFailureHandler(err => {
            isSaving.value = false;
            console.error(err);
          })
          .apiGetAllWeeks();
      } else {
        isSaving.value = false;
        alert({ title: '오류', message: (res && res.message) || '저장 중 오류가 발생했습니다.', isDanger: true });
      }
    })
    .withFailureHandler((err) => {
      isSaving.value = false;
      console.error(err);
      alert({ title: '오류', message: '서버 오류가 발생했습니다.', isDanger: true });
    })
    .apiBatchSaveWeeks(payload);
};
</script>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: translateY(20px) scale(0.95);
}

/* Custom Scrollbar for matrix */
.overflow-y-auto::-webkit-scrollbar {
  width: 8px;
}
.overflow-y-auto::-webkit-scrollbar-track {
  background: transparent;
}
.overflow-y-auto::-webkit-scrollbar-thumb {
  background-color: #e2e8f0;
  border-radius: 20px;
}
</style>