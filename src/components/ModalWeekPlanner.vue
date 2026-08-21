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
          <div class="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-50 flex items-center justify-between gap-2 bg-indigo-50/30 rounded-t-3xl">
            <div class="flex flex-wrap items-center gap-2 sm:gap-4 min-w-0">
              <h3 class="text-lg sm:text-xl font-black text-gray-900 flex items-center gap-2 whitespace-nowrap">
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

            <!-- View Toggle -->
            <button
              @click="viewMode = viewMode === 'edit' ? 'calendar' : 'edit'"
              class="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 bg-white border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all shadow-sm active:scale-95 shrink-0"
              :title="viewMode === 'edit' ? '달력 뷰로 보기' : '편집 뷰로 돌아가기'"
            >
              <i class="ph-bold" :class="viewMode === 'edit' ? 'ph-calendar' : 'ph-pencil-simple'"></i>
              <span class="hidden sm:inline font-black text-sm whitespace-nowrap">{{ viewMode === 'edit' ? '달력 뷰' : '편집' }}</span>
            </button>
          </div>

          <!-- Body / Calendar (read-only) -->
          <div v-if="viewMode === 'calendar'" class="flex-1 overflow-y-auto bg-gray-50/50 p-4 sm:p-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div v-for="cal in calendarMonths" :key="cal.month" class="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <h4 class="text-sm font-black text-gray-800 mb-2 flex items-center gap-1.5">
                  <i class="ph-fill ph-calendar-blank text-indigo-400"></i>{{ selectedYear }}년 {{ cal.month }}월
                </h4>

                <div class="flex items-center gap-1 mb-1">
                  <div class="grid grid-cols-7 flex-1">
                    <span v-for="d in ['월','화','수','목','금','토','일']" :key="d" class="text-center text-[9px] font-black text-gray-300 uppercase">{{ d }}</span>
                  </div>
                  <div class="w-16 text-right text-[9px] font-black text-gray-300 uppercase">주차</div>
                </div>

                <div v-for="week in cal.weeks" :key="week.key"
                     class="flex items-center gap-1 rounded-lg px-0.5 py-0.5"
                     :class="week.row?.is_rest_week ? 'bg-gray-50' : ''">
                  <div class="grid grid-cols-7 flex-1">
                    <div v-for="day in week.days" :key="day.iso" class="flex items-center justify-center">
                      <span class="w-6 h-6 flex items-center justify-center text-[11px] font-bold rounded-full"
                            :class="day.iso === todayIso ? 'bg-indigo-600 text-white' : (day.inMonth ? 'text-gray-700' : 'text-gray-300')">
                        {{ day.date }}
                      </span>
                    </div>
                  </div>
                  <div class="w-16 flex justify-end">
                    <span v-if="week.row?.is_rest_week" class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-400 text-[9px] font-black whitespace-nowrap">
                      <i class="ph-fill ph-coffee"></i>휴식
                    </span>
                    <span v-else-if="week.row" class="inline-flex items-center px-1.5 py-0.5 rounded-md text-[9px] font-black whitespace-nowrap"
                          :class="duplicateLabels.has(labelKey(week.row)) ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-indigo-50 text-indigo-600'">
                      {{ week.row.month }}-{{ week.row.week_number }}주차
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Body / Matrix -->
          <div v-else class="flex-1 overflow-y-auto bg-gray-50/50 relative">
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
                  <div class="col-span-4 flex items-center justify-between sm:justify-start">
                    <span class="font-mono text-sm font-bold text-gray-700 tracking-tight">
                      {{ formatDateShort(row.start_date) }} ~ {{ formatDateShort(row.end_date) }}
                    </span>

                    <!-- Rest Week Checkbox (Mobile inline) -->
                    <label class="flex sm:hidden items-center gap-2 cursor-pointer group">
                      <div class="relative flex items-center justify-center w-5 h-5">
                        <input
                          v-model="row.is_rest_week"
                          @change="handleRestWeekChange(row)"
                          type="checkbox"
                          class="peer w-full h-full m-0 cursor-pointer appearance-none rounded border-2 border-gray-300 checked:bg-indigo-600 checked:border-indigo-600 transition-all"
                        />
                        <i class="ph-bold ph-check absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-[10px]"></i>
                      </div>
                      <span class="text-sm font-bold text-gray-500">휴식</span>
                    </label>
                  </div>

                  <!-- Duplicate label warning -->
                  <div v-if="!row.is_rest_week && duplicateLabels.has(labelKey(row))" class="col-span-12 flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-100 rounded-xl order-last mt-2 sm:mt-0">
                    <i class="ph-fill ph-warning-circle text-red-500 shrink-0"></i>
                    <span class="text-xs font-bold text-red-600 ">{{ row.year }}년 {{ row.month }}월 {{ row.week_number }}주차가 다른 주와 중복됩니다.</span>
                  </div>

                  <!-- Rest Week Checkbox (Desktop) -->
                  <div class="hidden sm:flex col-span-2 items-center justify-center">
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
                    </label>
                  </div>

                  <!-- Inputs grid for mobile -->
                  <div class="col-span-12 sm:col-span-6 grid grid-cols-3 gap-2 sm:contents">
                    <!-- Year/month stay editable on rest weeks: the dashboard still labels them by month, and straddling weeks need a manual call -->
                    <div class="col-span-1 sm:col-span-2 flex flex-col sm:block justify-center">
                      <div class="sm:hidden text-[10px] font-black text-gray-400 uppercase mb-1">연도</div>
                      <input v-model.number="row.year" type="number" class="w-full text-center py-2 bg-gray-50 border border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-gray-700 transition-all min-h-[44px]" />
                    </div>

                    <div class="col-span-1 sm:col-span-2 flex flex-col sm:block justify-center">
                      <div class="sm:hidden text-[10px] font-black text-gray-400 uppercase mb-1">지정 월</div>
                      <div class="relative">
                        <input v-model.number="row.month" type="number" min="1" max="12" class="w-full text-center py-2 bg-gray-50 border border-transparent focus:border-indigo-500 rounded-xl outline-none font-bold text-gray-700 transition-all pr-4 min-h-[44px]" />
                        <div class="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                          <span class="text-xs text-gray-400 font-bold">월</span>
                        </div>
                      </div>
                    </div>

                    <!-- Only the workout week number is withheld on a rest week -->
                    <div v-if="row.is_rest_week" class="col-span-1 sm:col-span-2 flex flex-col sm:block justify-center">
                      <div class="sm:hidden text-[10px] font-black text-transparent uppercase mb-1 select-none">&nbsp;</div>
                      <div class="w-full flex items-center justify-center py-2 bg-gray-100 rounded-xl shadow-inner min-h-[44px]">
                        <span class="text-xs font-bold text-gray-400 flex items-center gap-1.5">
                          <i class="ph-fill ph-coffee"></i> 휴식
                        </span>
                      </div>
                    </div>

                    <div v-else class="col-span-1 sm:col-span-2 flex flex-col sm:block justify-center">
                      <div class="sm:hidden text-[10px] font-black text-gray-400 uppercase mb-1">지정 주차</div>
                      <div class="relative">
                        <input v-model.number="row.week_number" type="number" min="1" max="6"
                              class="w-full text-center py-2 border rounded-xl outline-none font-black transition-all pr-6 shadow-inner min-h-[44px]"
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

          </div>

          <!-- Footer -->
          <div class="px-6 py-5 border-t border-gray-50 bg-white rounded-b-3xl flex items-center justify-end gap-3 shrink-0">
            <div v-if="hasBlockingIssue && viewMode === 'edit'" class="mr-auto flex items-center gap-2 text-red-600">
              <i class="ph-fill ph-warning-circle"></i>
              <span class="text-xs font-bold">주차 번호가 중복되거나 비어 있어 저장할 수 없습니다.</span>
            </div>
            <button @click="close" class="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-black shadow-sm hover:bg-gray-50 transition-all active:scale-95">닫기</button>
            <button v-if="viewMode === 'edit'" @click="saveBatch" :disabled="isSaving || hasBlockingIssue" class="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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
const viewMode = ref('edit');

const handleEsc = (e) => {
  if (e.key === 'Escape' && props.isOpen && !isSaving.value) close();
};

onMounted(() => window.addEventListener('keydown', handleEsc));
onUnmounted(() => window.removeEventListener('keydown', handleEsc));

const currentYear = new Date().getFullYear();
const availableYears = [];
for (let y = 2024; y <= currentYear + 1; y++) {
  availableYears.push(y);
}
const selectedYear = ref(currentYear);

const plannerMatrix = ref([]);

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

// (year, month, week_number) is the join key for workout_records — unique among workout weeks only; rest weeks hold no records
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

const generateMatrix = (year) => {
  const matrix = [];

  const jan1 = new Date(year, 0, 1);

  let dayOfWeek = jan1.getDay(); // 0 is Sunday, 1 is Monday
  let diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const startDate = new Date(jan1);
  startDate.setDate(startDate.getDate() - diffToMonday);

  const nextYearJan1 = new Date(year + 1, 0, 1);

  let currentStart = new Date(startDate);

  while (currentStart < nextYearJan1) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6);

    const startStr = formatDateFull(currentStart);
    const endStr = formatDateFull(currentEnd);

    const existingRecord = weeks.value.find(w => {
      if (!w.start_date) return false;
      // Handle standardized date (YYYY-MM-DD) or datetime (YYYY-MM-DD HH:mm:ss)
      const dbStart = String(w.start_date).split(' ')[0].split('T')[0];
      return dbStart === startStr;
    });

    // The Thursday decides a week's default month; the admin overrides straddling weeks manually
    const thursday = new Date(currentStart);
    thursday.setDate(thursday.getDate() + 3);

    if (existingRecord) {
      matrix.push({
        id: existingRecord.id,
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

    currentStart.setDate(currentStart.getDate() + 7);
  }

  matrix.forEach(row => {
    if (!row.needsDefaultNumber) return;
    row.week_number = nextFreeWeekNumber(matrix, row);
    row.needsDefaultNumber = false;
  });

  plannerMatrix.value = matrix;
};

const handleRestWeekChange = (row) => {
  // week_number is kept while a week is rest so unchecking restores the admin's choice;
  // a number is only invented when the row never had one (0, e.g. rows from the old schema)
  if (!row.is_rest_week && !(Number(row.week_number) > 0)) {
    row.week_number = nextFreeWeekNumber(plannerMatrix.value, row);
  }
};

watch(() => selectedYear.value, (newYear) => {
  if (props.isOpen) generateMatrix(newYear);
});

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    viewMode.value = 'edit';
    generateMatrix(selectedYear.value);
  }
});

const todayIso = formatDateFull(new Date());

// A straddling week appears in both month cards, labeled with its assigned (possibly overridden) month
const calendarMonths = computed(() => {
  const byMonday = new Map(plannerMatrix.value.map(r => [r.start_date, r]));
  const months = [];

  for (let m = 0; m < 12; m++) {
    const first = new Date(selectedYear.value, m, 1);
    const last = new Date(selectedYear.value, m + 1, 0);
    const start = new Date(first);
    const dow = first.getDay();
    start.setDate(first.getDate() - (dow === 0 ? 6 : dow - 1));

    const weekRows = [];
    for (let cur = new Date(start); cur <= last; cur.setDate(cur.getDate() + 7)) {
      const days = [];
      for (let k = 0; k < 7; k++) {
        const d = new Date(cur);
        d.setDate(cur.getDate() + k);
        days.push({ date: d.getDate(), inMonth: d.getMonth() === m, iso: formatDateFull(d) });
      }
      const key = formatDateFull(cur);
      weekRows.push({ key, days, row: byMonday.get(key) || null });
    }
    months.push({ month: m + 1, weeks: weekRows });
  }

  return months;
});

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

  // A rest week keeps its week_number so the choice survives toggling; the server ignores it for lookups
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
        google.script.run
          .withSuccessHandler(r => {
            isSaving.value = false;
            if (r.success) {
              weeks.value = r.data;
              // Rebuild from server truth so rejected/adjusted rows become visible; modal stays open
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