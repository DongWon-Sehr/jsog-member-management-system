<template>
  <div class="space-y-0 pb-6">
    <!-- Unified Header Section (Sticky) -->
    <div class="sticky top-28 md:top-16 z-30 bg-white">
      <div class="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between bg-indigo-50/30 rounded-t-3xl border-t border-x border-gray-100 gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
            <i class="ph-bold ph-terminal-window text-xl"></i>
          </div>
          <h2 class="text-xl font-black text-gray-900 tracking-tight">시스템 로그</h2>
        </div>
        
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <!-- Search Action -->
          <div class="relative group flex-1 min-w-[140px] sm:flex-none">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="ph-bold ph-magnifying-glass text-gray-400 group-focus-within:text-indigo-500 transition-colors"></i>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="액션 검색"
              class="pl-9 pr-4 py-2 bg-white border border-gray-200 focus:border-indigo-500 rounded-xl outline-none text-sm font-bold text-gray-900 shadow-sm transition-all w-full sm:w-48"
            />
          </div>

          <!-- Status Filter -->
          <select
            v-model="statusFilter"
            class="px-4 py-2 bg-white border border-gray-200 focus:border-indigo-500 rounded-xl outline-none text-sm font-bold text-gray-700 shadow-sm transition-all cursor-pointer shrink-0"
          >
            <option value="all">전체 상태</option>
            <option value="success">성공 (Success)</option>
            <option value="error">오류 (Error)</option>
          </select>

          <button @click="fetchLogs" :disabled="isLoading" class="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0" title="로그 새로고침">
            <i class="ph-bold ph-arrows-clockwise text-gray-500 text-xl" :class="{ 'animate-spin': isLoading }"></i>
          </button>
        </div>
      </div>

      <!-- List Header (Sticky Bottom Part) -->
      <div class="bg-gray-50/95 backdrop-blur-sm pt-6 px-6 pb-3 border-x border-gray-100">
        <div class="hidden md:grid grid-cols-12 gap-4 px-8 py-3 bg-gray-100 rounded-xl text-[11px] font-black text-gray-400 uppercase tracking-widest shadow-sm border border-gray-200">
          <div class="col-span-3 text-center">발생 일시</div>
          <div class="col-span-3 text-center">액션 유형</div>
          <div class="col-span-5 text-center">상세 내용</div>
          <div class="col-span-1 text-center">조회</div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="bg-gray-50/50 border-x border-b border-gray-100 rounded-b-3xl overflow-hidden min-h-[500px]">
      <div v-if="isLoading && filteredLogs.length === 0" class="py-32 flex flex-col items-center justify-center text-center">
        <i class="ph-bold ph-spinner animate-spin text-indigo-600 text-5xl mb-4"></i>
        <p class="text-indigo-800 font-black">로그를 불러오는 중입니다...</p>
      </div>

      <div v-else class="px-6 pb-6 space-y-3 pt-1">
        <div 
          v-for="log in filteredLogs" 
          :key="log.id" 
          @click="showLogDetail(log)"
          class="bg-white p-5 md:px-8 md:py-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-4"
        >
          <!-- Timestamp -->
          <div class="md:col-span-3 flex items-center md:justify-center gap-3">
            <span class="text-sm font-bold text-gray-600 font-mono">{{ formatFullDate(log.timestamp) }}</span>
          </div>

          <!-- Action -->
          <div class="md:col-span-3 flex items-center md:justify-center gap-2">
            <span class="md:hidden text-[10px] font-black text-gray-400 uppercase w-16 shrink-0">유형</span>
            <span
              class="px-2.5 py-1 rounded-lg text-[10px] font-black tracking-tight shadow-sm border"
              :class="getActionClass(log.action)"
            >
              {{ log.action }}
            </span>
          </div>

          <!-- Details Preview -->
          <div class="md:col-span-5 flex items-center md:justify-center gap-2 min-w-0">
            <span class="md:hidden text-[10px] font-black text-gray-400 uppercase w-16 shrink-0">내용</span>
            <span class="text-sm font-medium text-gray-500 truncate  max-w-xs md:max-w-md">{{ log.details || '-' }}</span>
          </div>

          <!-- Arrow -->
          <div class="md:col-span-1 flex items-center justify-end md:justify-center">
            <i class="ph-bold ph-magnifying-glass-plus text-gray-300 group-hover:text-indigo-500 transition-colors text-xl"></i>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!isLoading && filteredLogs.length === 0" class="py-32 text-center">
          <div class="inline-flex p-5 rounded-full bg-white shadow-sm border border-gray-100 mb-4">
            <i class="ph-bold ph-terminal text-gray-200 text-5xl"></i>
          </div>
          <p class="text-gray-400 font-black text-lg">기록이 없습니다.</p>
        </div>
      </div>
    </div>

    <!-- Log Detail Modal -->
    <Teleport to="body">
      <transition name="modal-fade">
        <div v-if="detailLog" class="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm transition-all duration-300">
          <div class="absolute inset-0 bg-gray-900/60"></div>
          <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden transform transition-all duration-300 scale-100 opacity-100">
            <div class="px-6 py-5 border-b border-gray-100 bg-indigo-50/30 flex justify-between items-center shrink-0">
              <div class="flex items-center gap-3">
                <div class="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
                  <i class="ph-bold ph-info text-xl"></i>
                </div>
                <h3 class="text-xl font-black text-gray-900">로그 상세 정보</h3>
              </div>
            </div>
            
            <div class="flex-1 overflow-y-auto p-6 space-y-6">
              <div class="grid grid-cols-2 gap-4">
                <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                  <p class="text-[10px] font-black text-gray-400 uppercase mb-1">발생 시각</p>
                  <p class="text-sm font-bold text-gray-800 font-mono">{{ detailLog.timestamp }}</p>
                </div>
                <div class="bg-gray-50 p-4 rounded-2xl border border-gray-100 shadow-inner">
                  <p class="text-[10px] font-black text-gray-400 uppercase mb-1">액션 유형</p>
                  <p class="text-sm font-black text-indigo-600 break-all">{{ detailLog.action }}</p>
                </div>
              </div>
              
              <div class="bg-gray-900 p-6 rounded-2xl border border-gray-800 shadow-inner">
                <p class="text-[10px] font-black text-gray-500 uppercase mb-3">상세 데이터 (JSON)</p>
                <pre class="text-xs text-emerald-400 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto">{{ formatJson(detailLog.details) }}</pre>
              </div>
            </div>

            <div class="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end shrink-0">
              <button @click="detailLog = null" class="px-8 py-2.5 bg-white border border-gray-200 text-gray-600 rounded-xl font-bold shadow-sm hover:bg-gray-50 transition-all text-sm">
                닫기
              </button>
            </div>
          </div>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useStore } from '../composables/useStore';
import { useDialog } from '../composables/useDialog';
import { downloadCsvFile, todayStamp } from '../composables/useCsv';

const { systemLogs: logs } = useStore();
const { alert } = useDialog();

const isLoading = ref(false);
const detailLog = ref(null);
const searchQuery = ref('');
const statusFilter = ref('all');

const filteredLogs = computed(() => {
  let list = [...logs.value];

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(l => (l.action || '').toLowerCase().includes(q));
  }

  if (statusFilter.value === 'success') {
    list = list.filter(l => !l.action.toUpperCase().includes('ERROR'));
  } else if (statusFilter.value === 'error') {
    list = list.filter(l => l.action.toUpperCase().includes('ERROR'));
  }

  return list;
});

const handleEsc = (e) => {
  if (e.key === 'Escape' && detailLog.value) {
    detailLog.value = null;
  }
};

const fetchLogs = () => {
  isLoading.value = true;
  google.script.run
    .withSuccessHandler((res) => {
      isLoading.value = false;
      if (res && res.success) {
        logs.value = res.data;
      } else {
        alert({ title: '오류', message: '로그를 불러오는데 실패했습니다.', isDanger: true });
      }
    })
    .withFailureHandler((err) => {
      isLoading.value = false;
      alert({ title: '오류', message: '서버 요청 중 오류가 발생했습니다.', isDanger: true });
    })
    .apiGetRecentLogs(50);
};

const showLogDetail = (log) => {
  detailLog.value = log;
};

const downloadCsv = () => {
  const data = filteredLogs.value;
  if (data.length === 0) return;

  const headers = ['발생일시', '액션유형', '상세내용'];
  const rows = data.map(l => [
    l.timestamp,
    l.action,
    l.details || ''
  ]);

  downloadCsvFile(`system_logs_${todayStamp()}.csv`, headers, rows);
};

const getActionClass = (action) => {
  if (!action) return 'bg-gray-50 text-gray-400 border-gray-200';
  const a = action.toUpperCase();
  if (a.includes('ERROR')) return 'bg-red-50 text-red-600 border-red-100';
  if (a.includes('ADD') || a.includes('BATCH')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';
  if (a.includes('WEBHOOK')) return 'bg-amber-50 text-amber-600 border-amber-100';
  return 'bg-blue-50 text-blue-600 border-blue-100';
};

const formatFullDate = (ts) => {
  if (!ts) return '-';
  const parts = ts.split(' ');
  if (parts.length < 2) return ts;
  return parts[0].slice(5) + ' ' + parts[1].slice(0, 8);
};

const formatJson = (details) => {
  if (!details) return '-';
  try {
    const obj = JSON.parse(details);
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return details;
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleEsc);
  fetchLogs();
});

onUnmounted(() => window.removeEventListener('keydown', handleEsc));
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
