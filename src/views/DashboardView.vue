<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-gray-800">대시보드</h2>
      <button @click="fullReload" class="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
        <i class="ph ph-arrows-clockwise text-gray-500 text-xl" :class="{ 'animate-spin': isRefreshing }"></i>
      </button>
    </div>

    <!-- Summary Stats -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
      <!-- Activity Member Card -->
      <div 
        @click="currentView = 'Members'"
        class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all active:scale-95 group"
      >
        <div class="p-3 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
          <i class="ph-duotone ph-users text-3xl"></i>
        </div>
        <div>
          <p class="text-xs font-black text-gray-400 uppercase tracking-widest">활동 회원</p>
          <p class="text-2xl font-black text-gray-900">{{ dashboardSummary.activeMemberCount }}명</p>
        </div>
      </div>

      <!-- Weekly Workout Card -->
      <div 
        @click="currentView = 'WorkoutRecords'"
        class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all active:scale-95 group"
      >
        <div class="p-3 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
          <i class="ph-duotone ph-play-circle text-3xl"></i>
        </div>
        <div>
          <p class="text-xs font-black text-gray-400 uppercase tracking-widest">이번 주 인증</p>
          <p class="text-2xl font-black text-gray-900">{{ dashboardSummary.weeklyWorkoutCount }}회</p>
        </div>
      </div>

      <!-- Total Rewards Card -->
      <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div class="p-3 rounded-xl bg-amber-50 text-amber-600">
          <i class="ph-duotone ph-gift text-3xl"></i>
        </div>
        <div>
          <p class="text-xs font-black text-gray-400 uppercase tracking-widest">누적 리워드</p>
          <p class="text-2xl font-black text-gray-900">{{ (dashboardSummary.totalPrizeAmount || 0).toLocaleString() }}원</p>
        </div>
      </div>
    </div>

    <!-- Charts / Main Content Placeholder -->
    <div class="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm min-h-[300px] flex flex-col items-center justify-center text-center">
      <div class="bg-indigo-50 p-4 rounded-full mb-4">
        <i class="ph-duotone ph-layout text-indigo-400 text-5xl"></i>
      </div>
      <h3 class="text-xl font-bold text-gray-800">준비 중인 화면입니다</h3>
      <p class="text-gray-500 max-w-xs mx-auto mt-2 font-medium">주간 운동 통계 및 랭킹 그래프가 이곳에 표시될 예정입니다.</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useStore } from '../composables/useStore';

const { dashboardSummary, currentView } = useStore();
const isRefreshing = ref(false);

const fullReload = () => {
  window.location.reload();
};
</script>
