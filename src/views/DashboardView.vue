<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-800">대시보드</h2>
      <!-- No individual refresh needed as it's part of the global load, but we can keep it as a full reload trigger -->
      <button @click="fullReload" class="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <i class="ph ph-arrows-clockwise text-gray-500 text-xl" :class="{ 'animate-spin': isRefreshing }"></i>
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div v-for="stat in stats" :key="stat.label" class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div :class="`p-3 rounded-xl ${stat.bgColor} ${stat.textColor}`">
          <i :class="`ph-duotone ${stat.icon} text-3xl`"></i>
        </div>
        <div>
          <p class="text-sm font-medium text-gray-500">{{ stat.label }}</p>
          <p class="text-2xl font-bold text-gray-900">{{ stat.value }}</p>
        </div>
      </div>
    </div>

    <!-- Charts / Main Content Placeholder -->
    <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
      <div class="bg-indigo-50 p-4 rounded-full mb-4">
        <i class="ph-duotone ph-layout text-indigo-400 text-5xl"></i>
      </div>
      <h3 class="text-lg font-semibold text-gray-800">준비 중인 화면입니다</h3>
      <p class="text-gray-500 max-w-xs mx-auto mt-2">주간 운동 통계 및 랭킹 그래프가 이곳에 표시될 예정입니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from '../composables/useStore';

const { dashboardSummary } = useStore();
const isRefreshing = ref(false);

const stats = computed(() => [
  { 
    label: '활동 회원', 
    value: `${dashboardSummary.activeMemberCount}명`, 
    icon: 'ph-users', 
    bgColor: 'bg-blue-50', 
    textColor: 'text-blue-600' 
  },
  { 
    label: '이번 주 인증', 
    value: `${dashboardSummary.weeklyWorkoutCount}회`, 
    icon: 'ph-play-circle', 
    bgColor: 'bg-emerald-50', 
    textColor: 'text-emerald-600' 
  },
  { 
    label: '누적 리워드', 
    value: `${(dashboardSummary.totalPrizeAmount || 0).toLocaleString()}원`, 
    icon: 'ph-gift', 
    bgColor: 'bg-amber-50', 
    textColor: 'text-amber-600' 
  },
]);

const fullReload = () => {
  // In a real app, you'd trigger the loadData from App.vue
  // For now, we'll just reload the window to trigger everything again
  window.location.reload();
};
</script>
