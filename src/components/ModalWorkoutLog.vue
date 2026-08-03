<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm transition-all duration-300">
        <!-- Dim Overlay -->
        <div class="absolute inset-0 bg-gray-900/60 transition-opacity duration-300"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100 opacity-100">
          
          <!-- Header (Static) -->
          <div class="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 bg-indigo-50/30 shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <i class="ph-fill ph-notebook text-xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">{{ memberName }} 님의 운동 기록</h3>
                <p class="text-sm font-medium text-gray-500">
                  {{ formatWeekLabel(weekData) }} ({{ weekData?.start_date }} ~ {{ weekData?.end_date }})
                </p>
              </div>
            </div>
          </div>

          <!-- Main Scrollable Body -->
          <div class="flex-1 overflow-y-auto bg-white">
            <!-- Top Sections (Note & Add) -->
            <div class="p-4 sm:p-6 pb-0 space-y-4 sm:space-y-6">
              <!-- Weekly Note Section -->
              <div class="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100">
                <h4 class="text-sm font-bold text-indigo-700 mb-2 flex items-center gap-2">
                  <i class="ph-bold ph-note-pencil"></i>
                  이번 주차 메모
                </h4>
                <input 
                  v-model="localWeeklyNote"
                  type="text" 
                  placeholder="부상, 개인사정 등 이번 주차 특이사항"
                  class="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-500 transition-all shadow-sm"
                />
              </div>

              <!-- Add New Log Form -->
              <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                <h4 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                  <i class="ph-bold ph-plus-circle text-indigo-500"></i>
                  새 운동 기록 추가
                </h4>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
                  <div class="flex flex-col">
                    <label class="text-xs font-bold text-gray-500 mb-1">날짜</label>
                    <select v-model="newDate" class="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm font-bold text-gray-900 outline-none focus:border-indigo-500 transition-all h-[38px] cursor-pointer">
                      <option v-for="d in weekDates" :key="d.value" :value="d.value">{{ d.label }}</option>
                    </select>
                  </div>
                  <div class="flex flex-col">
                    <label class="text-xs font-bold text-gray-500 mb-1">시간</label>
                    <TimeInput v-model="newTime" />
                  </div>
                  <div class="flex flex-col">
                    <label class="text-xs font-bold text-gray-500 mb-1">운동 종류</label>
                    <input v-model="newType" type="text" placeholder="런닝, 필라테스 등" class="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all h-[38px]">
                  </div>
                  <div class="flex items-end gap-2">
                    <div class="flex flex-col flex-1">
                      <label class="text-xs font-bold text-gray-500 mb-1">운동 시간 (분)</label>
                      <input v-model="newDuration" type="number" min="1" class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all h-[38px]">
                    </div>
                    <button @click="addLogLocal" class="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex-shrink-0 shadow-sm h-[38px]">
                      <i class="ph-bold ph-plus"></i>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Existing Logs List Section -->
            <div class="p-4 sm:p-6 space-y-3">
              <div class="flex items-center justify-between px-1">
                <h4 class="text-sm font-bold text-gray-700 flex items-center gap-2">
                  <i class="ph-bold ph-list-dashes text-gray-400"></i>
                  운동 로그 ({{ localLogs.length }})
                </h4>
                <p v-if="hasDuplicates" class="text-[10px] font-black text-red-500 animate-pulse flex items-center gap-1">
                  <i class="ph-bold ph-warning-circle"></i>
                  중복 데이터 존재
                </p>
              </div>

              <!-- List Body -->
              <div class="bg-gray-50/50 rounded-2xl border border-gray-100 shadow-inner overflow-visible">
                <!-- Table Header (Sticky) -->
                <div class="hidden sm:block sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 rounded-t-2xl">
                  <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-sm border border-gray-200">
                    <div class="col-span-2">날짜</div>
                    <div class="col-span-3 text-center">시간</div>
                    <div class="col-span-3">운동 종류</div>
                    <div class="col-span-4 text-center">운동 시간 (분)</div>
                  </div>
                </div>

                <!-- List Content -->
                <div class="px-4 pb-4 space-y-2 pt-3">
                  <div v-if="localLogs.length === 0" class="py-12 flex flex-col items-center justify-center text-center">
                    <i class="ph-fill ph-empty text-gray-200 text-4xl mb-2"></i>
                    <p class="text-sm font-bold text-gray-400">기록이 없습니다.</p>
                  </div>

                  <div v-else v-for="log in localLogs" :key="log.id" 
                    class="flex flex-col gap-3 p-4 bg-white rounded-2xl border-2 shadow-sm relative transition-all hover:border-indigo-200 sm:grid sm:grid-cols-12 sm:gap-2 sm:px-4 sm:py-1.5 sm:items-center sm:rounded-xl group"
                    :class="[
                      duplicateIds.has(log.id) ? 'border-red-400 bg-red-50/30' : 'border-gray-50',
                      { 'animate-highlight': recentlyAddedIds.includes(log.id) }
                    ]"
                  >
                    <!-- Badges -->
                    <div class="absolute left-2 top-2 sm:left-0.5 sm:top-0.5 z-10 flex gap-0.5">
                      <span v-if="duplicateIds.has(log.id)" class="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-black text-white shadow-sm ring-1 ring-white" title="중복 데이터">!</span>
                      <span v-if="log.isNew || log.isModified" 
                        class="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white shadow-sm ring-1 ring-white"
                        :class="log.isNew ? 'bg-red-500' : 'bg-orange-500'"
                      >
                        {{ log.isNew ? 'N' : 'M' }}
                      </span>
                    </div>

                    <!-- Inline Editable Fields -->
                    <!-- Date & Time Group -->
                    <div class="grid grid-cols-2 gap-2 sm:contents">
                      <!-- Date Input -->
                      <div class="col-span-1 sm:col-span-2 flex flex-col sm:block">
                        <label class="text-[10px] font-bold text-gray-400 sm:hidden">날짜</label>
                        <select
                          v-model="log.local_date"
                          @change="updateLogTimestamp(log)"
                          class="w-full bg-gray-50 border border-gray-200 text-xs font-bold text-gray-900 rounded-xl p-2 outline-none focus:border-indigo-500 transition-all cursor-pointer sm:bg-transparent sm:border-none sm:text-[11px] sm:rounded sm:p-0.5 sm:focus:ring-1 sm:focus:ring-indigo-200"
                        >
                          <option v-for="d in weekDates" :key="d.value" :value="d.value">{{ d.label }}</option>
                        </select>
                      </div>

                      <!-- Time Input -->
                      <div class="col-span-1 sm:col-span-3 flex flex-col sm:block">
                        <label class="text-[10px] font-bold text-gray-400 sm:hidden">시간</label>
                        <TimeInput 
                          v-model="log.local_time"
                          @update:model-value="updateLogTimestamp(log)"
                          variant="responsive-mini"
                        />
                      </div>
                    </div>

                    <!-- Type & Duration Group -->
                    <div class="grid grid-cols-2 gap-2 sm:contents">
                      <!-- Workout Type -->
                      <div class="col-span-1 sm:col-span-3 flex flex-col sm:block">
                        <label class="text-[10px] font-bold text-gray-400 sm:hidden">운동 종류</label>
                        <input 
                          type="text" 
                          v-model="log.workout_type"
                          @change="markAsModified(log)"
                          placeholder="종류"
                          class="w-full bg-gray-50 border border-gray-200 text-xs font-bold text-gray-700 rounded-xl p-2 outline-none focus:border-indigo-500 transition-all sm:bg-transparent sm:border-none sm:text-[11px] sm:rounded sm:p-0.5 sm:focus:ring-1 sm:focus:ring-indigo-200 truncate"
                        />
                      </div>

                      <!-- Duration -->
                      <div class="col-span-1 sm:col-span-3 flex flex-col sm:block">
                        <label class="text-[10px] font-bold text-gray-400 sm:hidden">운동 시간 (분)</label>
                        <input 
                          type="number" 
                          v-model="log.duration_minutes"
                          @change="markAsModified(log)"
                          class="w-full bg-gray-50 border border-gray-200 text-xs font-black text-gray-500 rounded-xl p-2 outline-none focus:border-indigo-500 transition-all sm:bg-transparent sm:border-none sm:text-[11px] sm:text-center sm:rounded sm:py-0.5 sm:focus:ring-1 sm:focus:ring-indigo-200"
                        />
                      </div>
                    </div>

                    <!-- Delete Button -->
                    <div class="absolute right-2 top-2 sm:relative sm:right-auto sm:top-auto sm:col-span-1 sm:text-right flex justify-end">
                      <button @click="deleteLogLocal(log.id)" class="p-2 sm:p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl sm:rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                        <i class="ph-bold ph-trash text-base sm:text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer (Static) -->
          <div class="px-4 sm:px-6 py-3.5 sm:py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button @click="close" class="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 text-sm">
              닫기
            </button>
            <button @click="saveBatch" :disabled="isProcessing || !hasChanges || hasDuplicates" class="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm">
              저장하기
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from '../composables/useStore';
import { useDialog } from '../composables/useDialog';
import { formatWeekLabel } from '../composables/weekUtils';
import TimeInput from './TimeInput.vue';

const props = defineProps({
  isOpen: Boolean,
  memberId: String,
  weekData: Object
});

useScrollLock(toRef(props, 'isOpen'));

const emit = defineEmits(['close']);

const { memberMap, workoutRecords, workoutLogs } = useStore();
const { alert, confirm } = useDialog();

const isProcessing = ref(false);
const localLogs = ref([]);
const deletedIds = ref([]);
const localWeeklyNote = ref('');
const initialWeeklyNote = ref('');
const recentlyAddedIds = ref([]);

// Form states
const newDate = ref('');
const newTime = ref('00:00');
const newType = ref('');
const newDuration = ref(30);

const memberName = computed(() => memberMap.value[props.memberId]?.name || '회원');

const hasChanges = computed(() => {
  return localLogs.value.some(l => l.isNew || l.isModified) || 
         deletedIds.value.length > 0 || 
         localWeeklyNote.value !== initialWeeklyNote.value;
});

// Duplicate Detection
const duplicateIds = computed(() => {
  const dateMap = {};
  const conflictIds = new Set();
  
  localLogs.value.forEach(log => {
    const key = `${log.local_date} ${log.local_time}`;
    if (!dateMap[key]) {
      dateMap[key] = [];
    }
    dateMap[key].push(log.id);
  });

  Object.values(dateMap).forEach(ids => {
    if (ids.length > 1) {
      ids.forEach(id => conflictIds.add(id));
    }
  });

  return conflictIds;
});

const hasDuplicates = computed(() => duplicateIds.value.size > 0);

const handleEsc = (e) => {
  if (e.key === 'Escape' && props.isOpen) close();
};

onMounted(() => window.addEventListener('keydown', handleEsc));
onUnmounted(() => window.removeEventListener('keydown', handleEsc));

// Helper to parse "YYYY-MM-DD HH:mm:ss" or Date objects into UI-ready strings
const parseToLocalParts = (input) => {
  if (!input) return { date: '', time: '00:00' };
  
  let dateObj = null;
  if (input instanceof Date) {
    dateObj = input;
  } else {
    const str = String(input).replace(' ', 'T');
    dateObj = new Date(str);
  }

  if (isNaN(dateObj.getTime())) {
    const parts = String(input).split(' ');
    return { date: parts[0] || '', time: (parts[1] || '00:00').slice(0, 5) };
  }
  
  const pad = n => n < 10 ? '0'+n : n;
  return {
    date: `${dateObj.getFullYear()}-${pad(dateObj.getMonth()+1)}-${pad(dateObj.getDate())}`,
    time: `${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}`
  };
};

const weekRange = computed(() => {
  if (!props.weekData) return { start: '', end: '' };
  return {
    start: parseToLocalParts(props.weekData.start_date).date,
    end: parseToLocalParts(props.weekData.end_date).date
  };
});

const WEEKDAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'];

// The modal edits one week at a time while the weekly count is stored per (year, month, week).
// A log dated outside this week would be saved under a different week while inflating this
// week's count, so the date field offers only this week's days - a wrong date is not selectable.
const weekDates = computed(() => {
  const { start, end } = weekRange.value;
  if (!start || !end) return [];

  const pad = n => n < 10 ? '0'+n : n;
  const cursor = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  if (isNaN(cursor.getTime()) || isNaN(last.getTime())) return [];

  const dates = [];
  // Guard against a malformed week range spinning forever.
  while (cursor <= last && dates.length < 31) {
    dates.push({
      value: `${cursor.getFullYear()}-${pad(cursor.getMonth()+1)}-${pad(cursor.getDate())}`,
      label: `${pad(cursor.getMonth()+1)}/${pad(cursor.getDate())} (${WEEKDAY_LABELS[cursor.getDay()]})`
    });
    cursor.setDate(cursor.getDate() + 1);
  }
  return dates;
});

const syncLocalState = () => {
  if (!props.weekData || !props.memberId) {
    localLogs.value = [];
    localWeeklyNote.value = '';
    initialWeeklyNote.value = '';
    return;
  }
  
  const startParts = parseToLocalParts(props.weekData.start_date);
  const endParts = parseToLocalParts(props.weekData.end_date);
  const startDate = startParts.date;
  const endDate = endParts.date;

  localLogs.value = workoutLogs.value
    .filter((log) => {
      const idMatch = String(log.member_id) === String(props.memberId);
      const parts = parseToLocalParts(log.workout_date);
      const dateMatch = parts.date >= startDate && parts.date <= endDate;
      return idMatch && dateMatch;
    })
    .map(log => {
      const parts = parseToLocalParts(log.workout_date);
      return { 
        ...log, 
        local_date: parts.date,
        local_time: parts.time,
        isNew: false, 
        isModified: false 
      };
    })
    .sort((a, b) => new Date(b.workout_date) - new Date(a.workout_date));
  
  const record = workoutRecords.value.find(r => 
    String(r.member_id) === String(props.memberId) &&
    String(r.year) === String(props.weekData.year) &&
    String(r.month) === String(props.weekData.month) &&
    String(r.week_number) === String(props.weekData.week_number)
  );
  
  const note = record ? (record.note || '') : '';
  localWeeklyNote.value = note;
  initialWeeklyNote.value = note;
  deletedIds.value = [];
};

const setDefaultValues = () => {
  if (props.isOpen && props.weekData) {
    const now = new Date();
    const pad = n => n < 10 ? '0'+n : n;
    const todayStr = `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}`;
    
    const { start: startDate, end: endDate } = weekRange.value;
    
    let defaultDate = todayStr;
    if (todayStr < startDate) defaultDate = startDate;
    else if (todayStr > endDate) defaultDate = endDate;
    
    newDate.value = defaultDate;
    newTime.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    newType.value = '';
    newDuration.value = 30;
  }
};

onMounted(() => {
  syncLocalState();
  setDefaultValues();
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    syncLocalState();
    setDefaultValues();
  }
});

watch(() => workoutLogs.value, () => {
  if (props.isOpen) syncLocalState();
}, { deep: true });

const close = () => {
  emit('close');
};

const addLogLocal = () => {
  if (!newDate.value || !newTime.value) return;
  const tempId = 'new-' + Date.now();

  localLogs.value.unshift({
    id: tempId,
    member_id: props.memberId,
    workout_date: `${newDate.value} ${newTime.value}`,
    local_date: newDate.value,
    local_time: newTime.value,
    workout_type: newType.value,
    duration_minutes: Number(newDuration.value),
    isNew: true,
    isModified: false
  });

  recentlyAddedIds.value.push(tempId);
  setTimeout(() => {
    recentlyAddedIds.value = recentlyAddedIds.value.filter(id => id !== tempId);
  }, 2000);

  const now = new Date();
  const pad = n => n < 10 ? '0'+n : n;
  newTime.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
};

const updateLogTimestamp = (log) => {
  log.workout_date = `${log.local_date} ${log.local_time}`;
  markAsModified(log);
};

const markAsModified = (log) => {
  if (!log.isNew) log.isModified = true;
};

const deleteLogLocal = (id) => {
  const log = localLogs.value.find(l => l.id === id);
  if (!log) return;
  if (!log.isNew) deletedIds.value.push(id);
  localLogs.value = localLogs.value.filter(l => l.id !== id);
};

const saveBatch = () => {
  const prevLogs = JSON.parse(JSON.stringify(workoutLogs.value));
  const prevRecords = JSON.parse(JSON.stringify(workoutRecords.value));

  const logsToAddLocal = localLogs.value.filter(l => l.isNew);
  const tempIds = logsToAddLocal.map(l => l.id);

  const logsToAdd = logsToAddLocal.map(l => ({
    workout_date: l.workout_date,
    workout_type: l.workout_type,
    duration_minutes: l.duration_minutes
  }));
  const logsToUpdate = localLogs.value.filter(l => l.isModified).map(l => ({
    id: l.id,
    workout_date: l.workout_date,
    workout_type: l.workout_type,
    duration_minutes: l.duration_minutes
  }));
  const idsToDelete = deletedIds.value;
  const weeklyNote = localWeeklyNote.value;

  // Optimistic UI updates
  // 1. Update global logs list
  let updatedLogs = workoutLogs.value.filter(l => !idsToDelete.includes(l.id));
  logsToUpdate.forEach(u => {
    const idx = updatedLogs.findIndex(l => l.id === u.id);
    if (idx > -1) updatedLogs[idx] = { ...updatedLogs[idx], ...u };
  });
  const timestamp = new Date().toISOString();
  logsToAddLocal.forEach(l => {
    updatedLogs.push({
      id: l.id,
      member_id: props.memberId,
      workout_date: l.workout_date,
      workout_type: l.workout_type,
      duration_minutes: l.duration_minutes,
      created_at: timestamp
    });
  });
  workoutLogs.value = updatedLogs;

  // 2. Update global records summary
  const recordIndex = workoutRecords.value.findIndex(r => 
    String(r.member_id) === String(props.memberId) &&
    String(r.year) === String(props.weekData.year) &&
    String(r.month) === String(props.weekData.month) &&
    String(r.week_number) === String(props.weekData.week_number)
  );

  // localLogs holds exactly this member's logs for this week (all validated in-range), so its
  // length is the authoritative count. Mirrors how the server recomputes it.
  const weekLogCount = localLogs.value.length;
  if (recordIndex > -1) {
    workoutRecords.value[recordIndex].count = weekLogCount;
    workoutRecords.value[recordIndex].note = weeklyNote;
  } else {
    workoutRecords.value.push({
      member_id: props.memberId,
      year: props.weekData.year,
      month: props.weekData.month,
      week_number: props.weekData.week_number,
      count: weekLogCount,
      super_pass: false,
      note: weeklyNote
    });
  }

  isProcessing.value = true;
  emit('close');

  google.script.run
    .withSuccessHandler((res) => {
      isProcessing.value = false;
      if (res && res.success) {
        // Swap temp IDs with permanent server-assigned IDs
        if (res.data.added) {
          const finalLogs = [...workoutLogs.value];
          res.data.added.forEach((serverLog, index) => {
            const tempId = tempIds[index];
            const idx = finalLogs.findIndex(l => l.id === tempId);
            if (idx > -1) {
              finalLogs[idx] = serverLog;
            }
          });
          workoutLogs.value = finalLogs;
        }
        syncLocalState();
      } else {
        // Rollback
        workoutLogs.value = prevLogs;
        workoutRecords.value = prevRecords;
        syncLocalState();
        alert({ title: '오류', message: '저장에 실패했습니다: ' + (res?.message || '알 수 없는 오류'), isDanger: true });
      }
    })
    .withFailureHandler((err) => {
      isProcessing.value = false;
      // Rollback
      workoutLogs.value = prevLogs;
      workoutRecords.value = prevRecords;
      syncLocalState();
      alert({ title: '오류', message: '서버 요청 중 오류가 발생했습니다.', isDanger: true });
    })
    .apiBatchSaveWorkoutLogs(props.memberId, props.weekData.year, props.weekData.month, props.weekData.week_number, logsToAdd, logsToUpdate, idsToDelete, weeklyNote);
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