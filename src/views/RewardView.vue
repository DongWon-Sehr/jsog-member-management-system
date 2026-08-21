<template>
  <div id="reward-page" class="space-y-0 pb-6">
    <!-- Unified Header Section (Sticky) -->
    <div class="sticky top-28 md:top-16 z-30 bg-white">
      <!-- Page Title & Primary Actions (Indigo Style) -->
      <div class="px-6 py-5 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between bg-indigo-50/30 rounded-t-3xl border-t border-x border-gray-100 gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
            <i class="ph-bold ph-gift text-xl"></i>
          </div>
          <h2 class="text-xl font-black text-gray-900 tracking-tight">리워드 관리</h2>
        </div>
        
        <div class="flex flex-wrap items-center gap-2 sm:gap-3">
          <!-- Search Member -->
          <div class="relative group flex-1 min-w-[160px] sm:flex-none">
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

          <button @click="fetchRewards" :disabled="isLoading" class="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0" title="로그 새로고침">
            <i class="ph-bold ph-arrows-clockwise text-gray-500 text-xl" :class="{ 'animate-spin': isLoading }"></i>
          </button>
          <button @click="isRecommendationOpen = true" class="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-white border border-indigo-200 text-indigo-600 rounded-xl hover:bg-indigo-50 transition-all shadow-sm active:scale-95 shrink-0">
            <i class="ph-bold ph-magic-wand text-lg"></i>
            <span class="font-black text-sm whitespace-nowrap">추천 받기</span>
          </button>
          <button @click="openAddModal" class="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 shrink-0">
            <i class="ph-bold ph-plus text-lg"></i>
            <span class="font-black text-sm whitespace-nowrap">지급 등록</span>
          </button>

          <button @click="takeScreenshot" :disabled="rewards.length === 0" class="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0" title="스크린샷 저장">
            <i class="ph-bold ph-camera text-gray-500 text-xl"></i>
          </button>

          <button @click="downloadCsv" :disabled="rewards.length === 0" class="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0" title="CSV 다운로드">
            <i class="ph-bold ph-download-simple text-gray-500 text-xl"></i>
          </button>
        </div>
      </div>

      <!-- List Header (Sticky Bottom Part) -->
      <div class="bg-gray-50/95 backdrop-blur-sm pt-4 px-6 pb-3 border-x border-gray-100">
        <!-- Quick Summary Bar -->
        <div v-if="rewards.length > 0" class="flex flex-wrap items-center gap-3 sm:gap-6 mb-4 px-2">
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">총 지급 건수</span>
            <span class="text-sm font-black text-gray-900 whitespace-nowrap">{{ rewards.length }}건</span>
          </div>
          <div class="h-3 w-px bg-gray-200"></div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap">총 지급액</span>
            <span class="text-sm font-black text-indigo-600 whitespace-nowrap">{{ totalRewardAmount.toLocaleString() }}원</span>
          </div>
        </div>

        <div class="hidden md:grid grid-cols-12 gap-4 px-8 py-3 bg-gray-100 rounded-xl text-[11px] font-black text-gray-400 uppercase tracking-widest shadow-sm border border-gray-200">
          <div class="col-span-2 text-center">지급 대상</div>
          <div class="col-span-2 text-center">지급 일자</div>
          <div class="col-span-2 text-center">금액</div>
          <div class="col-span-5 text-center">설명</div>
          <div class="col-span-1"></div>
        </div>
      </div>
    </div>

    <!-- Main Content Area -->
    <div id="reward-capture-area" class="bg-gray-50/50 border-x border-b border-gray-100 rounded-b-3xl overflow-hidden min-h-[500px]">
      <div v-if="isLoading && rewards.length === 0" class="py-32 flex flex-col items-center justify-center text-center">
        <i class="ph-bold ph-spinner animate-spin text-indigo-600 text-5xl mb-4"></i>
        <p class="text-indigo-800 font-black">데이터를 불러오는 중입니다...</p>
      </div>

      <div v-else class="px-6 pb-6 space-y-3 pt-1">
        <div
          v-for="reward in sortedRewards"
          :key="reward.id"
          @click="openEditModal(reward)"
          :class="['bg-white p-5 md:px-8 md:py-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-4', { 'animate-highlight': recentlyAddedIds.includes(reward.id) }]"
        >
          <!-- Member Name -->
          <div class="md:col-span-2 flex items-center md:justify-center gap-3">
            <span class="font-bold text-gray-900 text-base">{{ getMemberName(reward.member_id) }}</span>
          </div>

          <!-- Reward Date -->
          <div class="md:col-span-2 flex items-center md:justify-center gap-2">
            <span class="md:hidden text-[10px] font-black text-gray-400 uppercase w-16 shrink-0">지급 일자</span>
            <span class="text-sm font-bold text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded-lg border border-gray-100">{{ reward.reward_date }}</span>
          </div>

          <!-- Amount -->
          <div class="md:col-span-2 flex items-center md:justify-center gap-2">
            <span class="md:hidden text-[10px] font-black text-gray-400 uppercase w-16 shrink-0">금액</span>
            <span class="text-base font-black text-indigo-600">{{ Number(reward.amount).toLocaleString() }}원</span>
          </div>

          <!-- Description -->
          <div class="md:col-span-5 flex items-center md:justify-center gap-2 min-w-0">
            <span class="md:hidden text-[10px] font-black text-gray-400 uppercase w-16 shrink-0">설명</span>
            <span class="text-sm font-medium text-gray-500 truncate  max-w-xs md:max-w-md">{{ reward.description || '-' }}</span>
          </div>

          <!-- Caret -->
          <div class="md:col-span-1 flex items-center justify-end">
            <i class="ph-bold ph-caret-right text-gray-300 group-hover:text-indigo-400 transition-colors"></i>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!isLoading && sortedRewards.length === 0" class="py-32 text-center">
          <div class="inline-flex p-5 rounded-full bg-white shadow-sm border border-gray-100 mb-4">
            <i class="ph-bold ph-gift text-gray-200 text-5xl"></i>
          </div>
          <p class="text-gray-400 font-black text-lg">기록이 없습니다.</p>
        </div>
      </div>
    </div>

    <!-- Reward Modal -->
    <ModalReward 
      v-if="isModalOpen"
      :is-open="isModalOpen"
      :is-processing="isProcessing"
      :initial-data="prefillData"
      @close="isModalOpen = false"
      @save="handleSaveReward"
      @delete="handleModalDelete"
    />

    <!-- Recommendation Modal -->
    <ModalRewardRecommendation
      v-if="isRecommendationOpen"
      :is-open="isRecommendationOpen"
      @close="isRecommendationOpen = false"
      @select="handleRecommendationSelect"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useStore } from '../composables/useStore';
import { useDialog } from '../composables/useDialog';
import ModalReward from '../components/ModalReward.vue';
import ModalRewardRecommendation from '../components/ModalRewardRecommendation.vue';
import { downloadCsvFile, todayStamp } from '../composables/useCsv';
import { useScreenshot } from '../composables/useScreenshot';

const { memberMap, rewards } = useStore();
const { alert, confirm } = useDialog();

const isLoading = ref(false);
const isProcessing = ref(false);
const isModalOpen = ref(false);
const isRecommendationOpen = ref(false);
const prefillData = ref(null);
const searchQuery = ref('');
const recentlyAddedIds = ref([]);

const getMemberName = (id) => memberMap.value[id]?.name || '알 수 없음';

const sortedRewards = computed(() => {
  let list = [...rewards.value];

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(r => getMemberName(r.member_id).toLowerCase().includes(q));
  }

  return list.sort((a, b) => {
    const dateA = String(a.reward_date || '').split(' ')[0].split('T')[0];
    const dateB = String(b.reward_date || '').split(' ')[0].split('T')[0];
    if (dateA !== dateB) return dateA < dateB ? 1 : -1;
    return String(b.created_at || '').localeCompare(String(a.created_at || ''));
  });
});

const totalRewardAmount = computed(() => {
  return rewards.value.reduce((sum, r) => sum + Number(r.amount), 0);
});

const fetchRewards = () => {
  isLoading.value = true;
  google.script.run
    .withSuccessHandler((res) => {
      isLoading.value = false;
      if (res && res.success) {
        rewards.value = res.data;
      }
    })
    .withFailureHandler(() => {
      isLoading.value = false;
      alert({ title: '오류', message: '데이터를 불러오는데 실패했습니다.', isDanger: true });
    })
    .apiGetAllRewards();
};

const openAddModal = () => {
  prefillData.value = null;
  isModalOpen.value = true;
};

const openEditModal = (reward) => {
  prefillData.value = {
    id: reward.id,
    memberId: reward.member_id,
    rewardDate: reward.reward_date,
    amount: Number(reward.amount),
    description: reward.description || ''
  };
  isModalOpen.value = true;
};

const handleRecommendationSelect = (data) => {
  prefillData.value = data;
  isRecommendationOpen.value = false;
  isModalOpen.value = true;
};

const handleSaveReward = (formData) => {
  isProcessing.value = true;

  if (formData.id) {
    const idx = rewards.value.findIndex(r => r.id === formData.id);
    if (idx === -1) {
      isProcessing.value = false;
      return;
    }
    const oldReward = { ...rewards.value[idx] };
    const updateData = {
      member_id: formData.memberId,
      reward_date: formData.rewardDate,
      amount: formData.amount,
      description: formData.description
    };
    
    rewards.value[idx] = { ...rewards.value[idx], ...updateData };

    google.script.run
      .withSuccessHandler((res) => {
        isProcessing.value = false;
        if (!res || !res.success) {
          rewards.value[idx] = oldReward;
          alert({ title: '오류', message: '리워드 수정에 실패했습니다.', isDanger: true });
        }
      })
      .withFailureHandler(() => {
        isProcessing.value = false;
        rewards.value[idx] = oldReward;
        alert({ title: '오류', message: '서버 요청 중 오류가 발생했습니다.', isDanger: true });
      })
      .apiUpdateReward(formData.id, updateData);
    isModalOpen.value = false;
    return;
  }

  const tempId = 'temp-' + Date.now();
  const tempReward = {
    id: tempId,
    member_id: formData.memberId,
    reward_date: formData.rewardDate,
    amount: Number(formData.amount),
    description: formData.description || '',
    created_at: new Date().toISOString()
  };
  
  rewards.value.unshift(tempReward);
  recentlyAddedIds.value.push(tempId);
  setTimeout(() => {
    recentlyAddedIds.value = recentlyAddedIds.value.filter(id => id !== tempId);
  }, 2000);

  google.script.run
    .withSuccessHandler((res) => {
      isProcessing.value = false;
      if (res && res.success) {
        const idx = rewards.value.findIndex(r => r.id === tempId);
        if (idx !== -1) {
          rewards.value[idx] = res.data;
          
          const hIdx = recentlyAddedIds.value.indexOf(tempId);
          if (hIdx > -1) {
            recentlyAddedIds.value[hIdx] = res.data.id;
            setTimeout(() => {
              recentlyAddedIds.value = recentlyAddedIds.value.filter(id => id !== res.data.id);
            }, 2000);
          }
        }
      } else {
        rewards.value = rewards.value.filter(r => r.id !== tempId);
        recentlyAddedIds.value = recentlyAddedIds.value.filter(id => id !== tempId);
        alert({ title: '오류', message: '리워드 지급 등록에 실패했습니다.', isDanger: true });
      }
    })
    .withFailureHandler(() => {
      isProcessing.value = false;
      rewards.value = rewards.value.filter(r => r.id !== tempId);
      recentlyAddedIds.value = recentlyAddedIds.value.filter(id => id !== tempId);
      alert({ title: '오류', message: '서버 요청 중 오류가 발생했습니다.', isDanger: true });
    })
    .apiAddReward(formData.memberId, formData.rewardDate, formData.amount, formData.description);
  isModalOpen.value = false;
};

const handleModalDelete = async (id) => {
  const ok = await confirm({
    title: '지급 내역 삭제',
    message: '해당 리워드 지급 내역을 정말 삭제하시겠습니까?',
    confirmText: '삭제',
    isDanger: true
  });

  if (!ok) return;

  const oldRewards = [...rewards.value];
  rewards.value = rewards.value.filter(r => r.id !== id);
  isModalOpen.value = false;

  google.script.run
    .withSuccessHandler((res) => {
      if (!res || !res.success) {
        rewards.value = oldRewards;
        alert({ title: '오류', message: '삭제에 실패했습니다.', isDanger: true });
      }
    })
    .withFailureHandler(() => {
      rewards.value = oldRewards;
      alert({ title: '오류', message: '서버 요청 중 오류가 발생했습니다.', isDanger: true });
    })
    .apiDeleteReward(id);
};

const { captureElement } = useScreenshot();
const takeScreenshot = () => captureElement(
  [{ id: 'gnb-capture', bg: '#ffffff' }, { id: 'reward-page' }],
  `jsog_rewards_${todayStamp()}.png`
);

const downloadCsv = () => {
  const data = sortedRewards.value;
  if (data.length === 0) return;

  const headers = ['지급대상', '지급일자', '금액', '상세내용'];
  const rows = data.map(r => [
    getMemberName(r.member_id),
    r.reward_date,
    r.amount,
    r.description || ''
  ]);

  downloadCsvFile(`rewards_history_${todayStamp()}.csv`, headers, rows);
};
</script>
