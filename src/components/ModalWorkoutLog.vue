<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm transition-all duration-300">
        <!-- Dim Overlay -->
        <div class="absolute inset-0 bg-gray-900/60 transition-opacity duration-300"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100 opacity-100">
          
          <!-- Processing Overlay -->
          <div v-if="isProcessing" class="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
            <i class="ph-bold ph-spinner animate-spin text-indigo-600 text-5xl mb-4"></i>
            <span class="text-indigo-800 font-bold">저장 중...</span>
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50/50">
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

          <!-- Main Body -->
          <div class="flex-1 overflow-y-auto p-6 bg-white space-y-6">
            
            <!-- Add New Log Form -->
            <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h4 class="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <i class="ph-bold ph-plus-circle text-indigo-500"></i>
                새 운동 기록 추가
              </h4>
              <form @submit.prevent="addLogLocal" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div class="flex flex-col">
                  <label class="text-xs font-bold text-gray-500 mb-1">날짜</label>
                  <input v-model="newDate" type="date" required class="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all">
                </div>
                <div class="flex flex-col">
                  <label class="text-xs font-bold text-gray-500 mb-1">시간</label>
                  <input v-model="newTime" type="time" required class="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all">
                </div>
                <div class="flex flex-col">
                  <label class="text-xs font-bold text-gray-500 mb-1">운동 종류</label>
                  <input v-model="newType" type="text" required placeholder="예: 런닝, 필라테스" class="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all">
                </div>
                <div class="flex flex-col">
                  <label class="text-xs font-bold text-gray-500 mb-1">시간(분)</label>
                  <div class="flex items-center gap-2">
                    <input v-model="newDuration" type="number" min="1" required class="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-all">
                    <button type="submit" class="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all flex-shrink-0">
                      <i class="ph-bold ph-plus"></i>
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <!-- Existing Logs List -->
            <div class="space-y-3">
              <h4 class="text-sm font-bold text-gray-700 flex items-center gap-2">
                <i class="ph-bold ph-list-dashes text-gray-400"></i>
                등록된 기록
              </h4>

              <div class="bg-gray-50/50 rounded-2xl border border-gray-100 overflow-hidden shadow-inner">
                <!-- Table Header (Sticky) -->
                <div class="sticky top-0 z-20 bg-gray-50/95 backdrop-blur-sm pt-4 px-4 pb-2">
                  <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-100 rounded-lg text-[10px] font-black text-gray-400 uppercase tracking-widest shadow-sm border border-gray-200">
                    <div class="col-span-5">운동 일시</div>
                    <div class="col-span-4">종류</div>
                    <div class="col-span-2 text-center">시간</div>
                    <div class="col-span-1"></div>
                  </div>
                </div>

                <!-- List Content -->
                <div class="px-4 pb-4 space-y-2">
                  <div v-if="localLogs.length === 0" class="py-12 flex flex-col items-center justify-center text-center">
                    <i class="ph-fill ph-empty text-gray-200 text-4xl mb-2"></i>
                    <p class="text-sm font-bold text-gray-400">이번 주 기록이 없습니다.</p>
                  </div>

                  <div v-else v-for="log in localLogs" :key="log.id" class="grid grid-cols-12 gap-2 px-4 py-3 bg-white rounded-xl border border-gray-50 shadow-sm items-center hover:border-indigo-200 transition-colors group relative">
                    <!-- New Badge -->
                    <div v-if="log.isNew" class="absolute -left-1 -top-1 z-10">
                      <span class="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white shadow-sm ring-2 ring-white">N</span>
                    </div>

                    <div class="col-span-5 flex flex-col">
                      <span class="text-sm font-bold text-gray-900">{{ log.workout_date.split(' ')[0] }}</span>
                      <span class="text-[10px] font-mono text-gray-400 font-bold">{{ log.workout_date.split(' ')[1] }}</span>
                    </div>
                    <div class="col-span-4 flex items-center gap-2">
                      <div class="w-6 h-6 rounded-md bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                        <i v-if="log.workout_type === '런닝'" class="ph-fill ph-person-simple-run text-sm"></i>
                        <i v-else-if="log.workout_type === '걷기'" class="ph-fill ph-person-simple-walk text-sm"></i>
                        <i v-else-if="log.workout_type === '수영'" class="ph-fill ph-swimmer text-sm"></i>
                        <i v-else class="ph-fill ph-barbell text-sm"></i>
                      </div>
                      <span class="text-xs font-bold text-gray-700 truncate">{{ log.workout_type }}</span>
                    </div>
                    <div class="col-span-2 text-center">
                      <span class="text-xs font-black text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">{{ log.duration_minutes }}분</span>
                    </div>
                    <div class="col-span-1 text-right">
                      <button @click="deleteLogLocal(log.id)" class="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-100 sm:opacity-0 group-hover:opacity-100 transition-all">
                        <i class="ph-bold ph-trash"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
            <button @click="close" :disabled="isProcessing" class="px-6 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 text-sm">
              닫기
            </button>
            <button @click="saveBatch" :disabled="isProcessing || !hasChanges" class="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50 text-sm">
              저장하기
            </button>
          </div>

        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from '../composables/useStore';
import { useDialog } from '../composables/useDialog';

const props = defineProps({
  isOpen: Boolean,
  memberId: String,
  weekData: Object
});

const emit = defineEmits(['close']);

const { memberMap, workoutRecords, workoutLogs } = useStore();
const { alert, confirm } = useDialog();

const isProcessing = ref(false);
const localLogs = ref([]);
const deletedIds = ref([]);

// Form states
const newDate = ref('');
const newTime = ref('');
const newType = ref('');
const newDuration = ref(30);

const memberName = computed(() => memberMap.value[props.memberId]?.name || '회원');

const hasChanges = computed(() => {
  return localLogs.value.some(l => l.isNew) || deletedIds.value.length > 0;
});

const handleEsc = (e) => {
  if (e.key === 'Escape' && props.isOpen && !isProcessing.value) close();
};

onMounted(() => window.addEventListener('keydown', handleEsc));
onUnmounted(() => window.removeEventListener('keydown', handleEsc));

// Filter logs from global store to local state when opening
const syncLocalLogs = () => {
  if (!props.weekData || !props.memberId) {
    localLogs.value = [];
    return;
  }
  
  const start = new Date(props.weekData.start_date);
  start.setHours(0,0,0,0);
  const end = new Date(props.weekData.end_date);
  end.setHours(23,59,59,999);

  localLogs.value = workoutLogs.value
    .filter(log => {
      if (log.member_id !== props.memberId) return false;
      const logDateStr = log.workout_date.split(' ')[0];
      const logDate = new Date(logDateStr);
      return logDate >= start && logDate <= end;
    })
    .map(log => ({ ...log, isNew: false }))
    .sort((a, b) => new Date(b.workout_date) - new Date(a.workout_date));
  
  deletedIds.value = [];
};

const setDefaultValues = () => {
  if (props.isOpen && props.weekData) {
    const today = new Date();
    const start = new Date(props.weekData.start_date);
    const end = new Date(props.weekData.end_date);
    
    let targetDate = today;
    if (today < start || today > end) {
      targetDate = start;
    }
    
    const pad = n => n < 10 ? '0'+n : n;
    newDate.value = `${targetDate.getFullYear()}-${pad(targetDate.getMonth()+1)}-${pad(targetDate.getDate())}`;
    newTime.value = `${pad(today.getHours())}:${pad(today.getMinutes())}`;
  }
};

onMounted(() => {
  syncLocalLogs();
  setDefaultValues();
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    syncLocalLogs();
    setDefaultValues();
  }
});

const close = () => {
  if (isProcessing.value) return;
  emit('close');
};

const addLogLocal = () => {
  if (!newDate.value || !newTime.value) return;

  const workoutDate = `${newDate.value} ${newTime.value}`;
  const tempId = 'new-' + Date.now();
  
  localLogs.value.unshift({
    id: tempId,
    member_id: props.memberId,
    workout_date: workoutDate,
    workout_type: newType.value,
    duration_minutes: newDuration.value,
    isNew: true
  });

  // Reset time but keep date
  const today = new Date();
  const pad = n => n < 10 ? '0'+n : n;
  newTime.value = `${pad(today.getHours())}:${pad(today.getMinutes())}`;
};

const deleteLogLocal = (id) => {
  const log = localLogs.value.find(l => l.id === id);
  if (!log) return;

  if (!log.isNew) {
    deletedIds.value.push(id);
  }
  localLogs.value = localLogs.value.filter(l => l.id !== id);
};

const saveBatch = () => {
  const logsToAdd = localLogs.value.filter(l => l.isNew).map(l => ({
    workout_date: l.workout_date,
    workout_type: l.workout_type,
    duration_minutes: l.duration_minutes
  }));
  const idsToDelete = deletedIds.value;

  if (logsToAdd.length === 0 && idsToDelete.length === 0) {
    close();
    return;
  }

  isProcessing.value = true;

  google.script.run
    .withSuccessHandler((res) => {
      isProcessing.value = false;
      if (res && res.success) {
        // Update global store
        // 1. Remove deleted logs
        workoutLogs.value = workoutLogs.value.filter(l => !idsToDelete.includes(l.id));
        // 2. Add newly created logs (from response data which has real IDs)
        if (res.data.added) {
          workoutLogs.value.push(...res.data.added);
        }
        
        // 3. Update workout record count in global store
        const recordIndex = workoutRecords.value.findIndex(r => 
          r.member_id === props.memberId &&
          String(r.year) === String(props.weekData.year) &&
          String(r.month) === String(props.weekData.month) &&
          String(r.week_number) === String(props.weekData.week_number)
        );

        const netChange = logsToAdd.length - idsToDelete.length;
        if (recordIndex > -1) {
          workoutRecords.value[recordIndex].count = Math.max(0, (Number(workoutRecords.value[recordIndex].count) || 0) + netChange);
        } else if (netChange > 0) {
          workoutRecords.value.push({
            member_id: props.memberId,
            year: props.weekData.year,
            month: props.weekData.month,
            week_number: props.weekData.week_number,
            count: netChange,
            super_pass: false,
            note: ''
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
    .apiBatchSaveWorkoutLogs(props.memberId, props.weekData.year, props.weekData.month, props.weekData.week_number, logsToAdd, idsToDelete);
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