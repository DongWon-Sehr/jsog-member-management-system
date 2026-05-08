<template>
  <div class="space-y-0 pb-6">
    <!-- Unified Header Section -->
    <div class="sticky top-16 z-30 bg-white">
      <div class="px-6 py-5 border-b border-gray-50 flex items-center justify-between bg-indigo-50/30 rounded-t-3xl border-t border-x border-gray-100">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
            <i class="ph-bold ph-chart-pie-slice text-xl"></i>
          </div>
          <h2 class="text-xl font-black text-gray-900 tracking-tight">대시보드</h2>
        </div>
        <button @click="fullReload" class="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95" title="새로고침">
          <i class="ph-bold ph-arrows-clockwise text-gray-500 text-xl" :class="{ 'animate-spin': isRefreshing }"></i>
        </button>
      </div>
    </div>

    <!-- Main Content Area -->
    <div class="bg-gray-50/50 border-x border-b border-gray-100 rounded-b-3xl p-6 space-y-6 min-h-[400px]">
      <!-- Summary Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Activity Member Card -->
        <div 
          @click="currentView = 'Members'"
          class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-indigo-200 hover:shadow-md transition-all active:scale-95 group"
        >
          <div class="p-4 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
            <i class="ph-bold ph-users text-3xl"></i>
          </div>
          <div>
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">활동 회원</p>
            <p class="text-2xl font-black text-gray-900">{{ dashboardSummary.activeMemberCount }}명</p>
          </div>
        </div>

        <!-- Weekly Workout Card -->
        <div 
          @click="currentView = 'WorkoutRecords'"
          class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 cursor-pointer hover:border-emerald-200 hover:shadow-md transition-all active:scale-95 group"
        >
          <div class="p-4 rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-inner">
            <i class="ph-bold ph-play-circle text-3xl"></i>
          </div>
          <div>
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">이번 주 인증</p>
            <p class="text-2xl font-black text-gray-900">{{ dashboardSummary.weeklyWorkoutCount }}회</p>
          </div>
        </div>

        <!-- Total Rewards Card -->
        <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
          <div class="p-4 rounded-xl bg-amber-50 text-amber-600 shadow-inner">
            <i class="ph-bold ph-gift text-3xl"></i>
          </div>
          <div>
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">누적 리워드</p>
            <p class="text-2xl font-black text-gray-900">{{ (dashboardSummary.totalPrizeAmount || 0).toLocaleString() }}원</p>
          </div>
        </div>
      </div>

      <!-- Charts / Main Content Placeholder -->
      <div class="bg-white p-12 rounded-2xl border border-gray-100 shadow-sm min-h-[350px] flex flex-col items-center justify-center text-center">
        <div class="bg-indigo-50 p-6 rounded-full mb-6 shadow-inner">
          <i class="ph-bold ph-layout text-indigo-400 text-5xl"></i>
        </div>
        <h3 class="text-xl font-black text-gray-800">준비 중인 화면입니다</h3>
        <p class="text-gray-500 max-w-xs mx-auto mt-3 font-bold">주간 운동 통계 및 랭킹 그래프가 이곳에 표시될 예정입니다.</p>
      </div>
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
