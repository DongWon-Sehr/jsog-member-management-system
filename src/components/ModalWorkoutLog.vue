<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm transition-all duration-300">
        <!-- Dim Overlay -->
        <div class="absolute inset-0 bg-gray-900/60 transition-opacity duration-300"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100 opacity-100">
          
          <!-- Processing Overlay -->
          <div v-if="isProcessing" class="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
            <i class="ph-bold ph-spinner animate-spin text-indigo-600 text-5xl mb-4"></i>
            <span class="text-indigo-800 font-bold">저장 중...</span>
          </div>

          <!-- Header (Static) -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-indigo-50/30 shrink-0">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <i class="ph-fill ph-notebook text-xl"></i>
              </div>
              <div>
                <h3 class="text-xl font-bold text-gray-900">{{ memberName }} 님의 운동 기록</h3>
                <p class="text-sm font-medium text-gray-500">
                  {{ weekData?.month }}월 {{ weekData?.week_number }}주차 ({{ weekData?.start_date }} ~ {{ weekData?.end_date }})
                </p>
              </div>
            </div>
          </div>

          <!-- Main Scrollable Body -->
          <div class="flex-1 overflow-y-auto bg-white">
            <!-- Top Sections (Note & Add) -->
            <div class="p-6 pb-0 space-y-6">
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
                    <input v-model="newDate" type="date" required class="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all h-[38px]">
                  </div>
                  <div class="flex flex-col">
                    <label class="text-xs font-bold text-gray-500 mb-1">시간</label>
                    <TimeInput v-model="newTime" />
                  </div>
                  <div class="flex flex-col">
                    <label class="text-xs font-bold text-gray-500 mb-1">운동 종류</label>
                    <input v-model="newType" type="text" placeholder="런닝, 필라테스 등" class="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all h-[38px]">
                  </div>
                  <div class="flex items-center gap-2">
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
            <div class="p-6 space-y-3">
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
                <div class="sticky top-0 z-30 bg-gray-50/95 backdrop-blur-sm px-4 py-3 border-b border-gray-100 rounded-t-2xl">
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
                    class="grid grid-cols-12 gap-2 px-4 py-1.5 bg-white rounded-xl border-2 shadow-sm items-center hover:border-indigo-200 transition-all group relative"
                    :class="duplicateIds.has(log.id) ? 'border-red-400 bg-red-50/30' : 'border-gray-50'"
                  >
                    <!-- Badges -->
                    <div class="absolute left-0.5 top-0.5 z-10 flex gap-0.5">
                      <span v-if="duplicateIds.has(log.id)" class="flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[8px] font-black text-white shadow-sm ring-1 ring-white" title="중복 데이터">!</span>
                      <span v-if="log.isNew || log.isModified" 
                        class="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-black text-white shadow-sm ring-1 ring-white"
                        :class="log.isNew ? 'bg-red-500' : 'bg-orange-500'"
                      >
                        {{ log.isNew ? 'N' : 'M' }}
                      </span>
                    </div>

                    <!-- Inline Editable Fields -->
                    <div class="col-span-2">
                      <input 
                        type="date" 
                        v-model="log.local_date"
                        @change="updateLogTimestamp(log)"
                        class="w-full bg-transparent border-none text-[11px] font-bold text-gray-900 outline-none focus:ring-1 focus:ring-indigo-200 rounded p-0.5 transition-all"
                      />
                    </div>
                    <div class="col-span-3">
                      <TimeInput 
                        v-model="log.local_time"
                        @update:model-value="updateLogTimestamp(log)"
                        class="custom-time-input-mini"
                      />
                    </div>
                    <div class="col-span-3">
                      <input 
                        type="text" 
                        v-model="log.workout_type"
                        @change="markAsModified(log)"
                        placeholder="종류"
                        class="w-full bg-transparent border-none text-[11px] font-bold text-gray-700 outline-none focus:ring-1 focus:ring-indigo-200 rounded p-0.5 transition-all truncate"
                      />
                    </div>
                    <div class="col-span-3 text-center">
                      <input 
                        type="number" 
                        v-model="log.duration_minutes"
                        @change="markAsModified(log)"
                        class="w-full bg-gray-50 border-none text-[11px] font-black text-gray-500 text-center outline-none focus:ring-1 focus:ring-indigo-200 rounded py-0.5 transition-all"
                      />
                    </div>
                    <div class="col-span-1 text-right">
                      <button @click="deleteLogLocal(log.id)" class="p-1 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                        <i class="ph-bold ph-trash text-sm"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer (Static) -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 shrink-0">
            <button @click="close" :disabled="isProcessing" class="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 text-sm">
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
  if (e.key === 'Escape' && props.isOpen && !isProcessing.value) close();
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
    
    const startDate = props.weekData.start_date.split(' ')[0].split('T')[0];
    const endDate = props.weekData.end_date.split(' ')[0].split('T')[0];
    
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
  if (isProcessing.value) return;
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
  const logsToAdd = localLogs.value.filter(l => l.isNew).map(l => ({
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

  isProcessing.value = true;

  google.script.run
    .withSuccessHandler((res) => {
      isProcessing.value = false;
      if (res && res.success) {
        workoutLogs.value = workoutLogs.value.filter(l => !idsToDelete.includes(l.id));
        logsToUpdate.forEach(u => {
          const idx = workoutLogs.value.findIndex(l => l.id === u.id);
          if (idx > -1) workoutLogs.value[idx] = { ...workoutLogs.value[idx], ...u };
        });
        if (res.data.added) workoutLogs.value.push(...res.data.added);
        
        const recordIndex = workoutRecords.value.findIndex(r => 
          String(r.member_id) === String(props.memberId) &&
          String(r.year) === String(props.weekData.year) &&
          String(r.month) === String(props.weekData.month) &&
          String(r.week_number) === String(props.weekData.week_number)
        );

        const netChange = logsToAdd.length - idsToDelete.length;
        if (recordIndex > -1) {
          workoutRecords.value[recordIndex].count = Math.max(0, (Number(workoutRecords.value[recordIndex].count) || 0) + netChange);
          workoutRecords.value[recordIndex].note = weeklyNote;
        } else {
          workoutRecords.value.push({
            member_id: props.memberId,
            year: props.weekData.year,
            month: props.weekData.month,
            week_number: props.weekData.week_number,
            count: Math.max(0, netChange),
            super_pass: false,
            note: weeklyNote
          });
        }
        close();
      } else {
        alert({ title: '오류', message: '저장에 실패했습니다: ' + (res?.message || '알 수 없는 오류'), isDanger: true });
      }
    })
    .withFailureHandler((err) => {
      isProcessing.value = false;
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