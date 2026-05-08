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
                   :class="{ 'opacity-70 bg-gray-50': row.isRestWeek }">
                
                <div class="flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-4 sm:gap-4">
                  <!-- Date Range -->
                  <div class="col-span-4 flex items-center">
                    <span class="font-mono text-sm font-bold text-gray-700 tracking-tight">
                      {{ formatDateShort(row.start_date) }} ~ {{ formatDateShort(row.end_date) }}
                    </span>
                  </div>

                  <!-- Rest Week Checkbox -->
                  <div class="col-span-2 flex items-center sm:justify-center">
                    <label class="flex items-center gap-2 cursor-pointer group">
                      <div class="relative flex items-center justify-center w-5 h-5">
                        <input 
                          v-model="row.isRestWeek"
                          @change="handleRestWeekChange(row)"
                          type="checkbox" 
                          class="peer w-full h-full m-0 cursor-pointer appearance-none rounded border-2 border-gray-300 checked:bg-indigo-600 checked:border-indigo-600 transition-all"
                        />
                        <i class="ph-bold ph-check absolute text-white opacity-0 peer-checked:opacity-100 pointer-events-none text-[10px]"></i>
                      </div>
                      <span class="text-sm font-bold text-gray-500 sm:hidden">휴식 주간</span>
                    </label>
                  </div>

                  <!-- Inputs (Hidden/Dimmed if Rest Week) -->
                  <div v-if="row.isRestWeek" class="col-span-6 flex items-center justify-center py-1 bg-gray-100 rounded-lg shadow-inner">
                    <span class="text-sm font-bold text-gray-400 flex items-center gap-2">
                      <i class="ph-fill ph-coffee"></i> 휴식 주간 (운동 제외)
                    </span>
                  </div>
                  <template v-else>
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
                    <div class="col-span-2">
                      <div class="sm:hidden text-[10px] font-black text-gray-400 uppercase mb-1">지정 주차</div>
                      <div class="relative">
                        <input v-model.number="row.week_number" type="number" min="1" max="6" class="w-full text-center py-2 bg-indigo-50 border border-transparent focus:border-indigo-500 rounded-xl outline-none font-black text-indigo-700 transition-all pr-6 shadow-inner" />
                        <div class="absolute inset-y-0 right-2 flex items-center pointer-events-none">
                          <span class="text-[10px] text-indigo-400 font-black">주차</span>
                        </div>
                      </div>
                    </div>
                  </template>
                </div>
              </div>
            </div>

          </div>

          <!-- Footer -->
          <div class="px-6 py-5 border-t border-gray-50 bg-white rounded-b-3xl flex justify-end gap-3 shrink-0">
            <button @click="close" class="px-6 py-3 bg-white border border-gray-200 text-gray-600 rounded-xl font-black shadow-sm hover:bg-gray-50 transition-all active:scale-95">닫기</button>
            <button @click="saveBatch" :disabled="isSaving" class="px-8 py-3 bg-indigo-600 text-white rounded-xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from '../composables/useStore';
import { useDialog } from '../composables/useDialog';

const props = defineProps({
  isOpen: Boolean
});

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

  // Month week tracker to generate smart default week numbers (1, 2, 3...)
  const monthWeekCounts = {};

  // 3. Loop by adding 7 days until we hit Jan 1st of the next year
  const nextYearJan1 = new Date(year + 1, 0, 1);
  
  let currentStart = new Date(startDate);

  while (currentStart < nextYearJan1) {
    const currentEnd = new Date(currentStart);
    currentEnd.setDate(currentEnd.getDate() + 6);

    const startStr = formatDateFull(currentStart);
    const endStr = formatDateFull(currentEnd);

    // Check if we have an existing record in the DB for this start_date
    const existingRecord = weeks.value.find(w => w.start_date === startStr);

    if (existingRecord) {
      // Use DB data
      matrix.push({
        start_date: startStr,
        end_date: endStr,
        year: Number(existingRecord.year),
        month: Number(existingRecord.month),
        week_number: Number(existingRecord.week_number),
        isRestWeek: Number(existingRecord.week_number) === 0
      });
    } else {
      // Smart Default Calculation based on Thursday
      const thursday = new Date(currentStart);
      thursday.setDate(thursday.getDate() + 3);
      
      const defaultYear = thursday.getFullYear();
      const defaultMonth = thursday.getMonth() + 1;
      
      monthWeekCounts[defaultMonth] = (monthWeekCounts[defaultMonth] || 0) + 1;
      const defaultWeekNum = monthWeekCounts[defaultMonth];

      matrix.push({
        start_date: startStr,
        end_date: endStr,
        year: defaultYear,
        month: defaultMonth,
        week_number: defaultWeekNum,
        isRestWeek: false
      });
    }

    // Move to next week
    currentStart.setDate(currentStart.getDate() + 7);
  }

  plannerMatrix.value = matrix;
};

// Handle Rest Week Toggle
const handleRestWeekChange = (row) => {
  if (row.isRestWeek) {
    row.week_number = 0; // Set to 0 for rest week internally
  } else {
    // If unchecked, try to restore a smart default for the week number to avoid keeping 0
    const thursday = new Date(row.start_date);
    thursday.setDate(thursday.getDate() + 3);
    row.month = thursday.getMonth() + 1;
    row.year = thursday.getFullYear();
    row.week_number = 1; // Basic fallback, admin will adjust
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

const saveBatch = () => {
  isSaving.value = true;

  // Prepare payload
  const payload = plannerMatrix.value.map(row => ({
    year: row.year,
    month: row.month,
    week_number: row.isRestWeek ? 0 : row.week_number,
    start_date: row.start_date,
    end_date: row.end_date
  }));

  google.script.run
    .withSuccessHandler((res) => {
      isSaving.value = false;
      if (res && res.success) {
        // Refresh local store data blindly to reflect new truths
        google.script.run.withSuccessHandler(r => {
          if (r.success) {
            weeks.value = r.data;
            // Modal remains open after saving
          }
        }).apiGetAllWeeks();
      } else {
        alert({ title: '오류', message: '저장 중 오류가 발생했습니다.', isDanger: true });
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