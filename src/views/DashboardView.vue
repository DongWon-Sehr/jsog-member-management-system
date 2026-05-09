<template>
  <div class="space-y-0 pb-6">
    <!-- Unified Header Section -->
    <div class="sticky top-16 z-30 bg-white">
      <div class="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-indigo-50/30 rounded-t-3xl border-t border-x border-gray-100">
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

      <!-- Charts / Main Content -->
      <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm min-h-[450px] flex flex-col">
        <h3 class="text-lg font-black text-gray-800 mb-6 flex items-center gap-2">
          <i class="ph-bold ph-chart-line-up text-indigo-500"></i>
          이번 분기 멤버별 누적 성적 ({{ currentQuarterLabel }})
        </h3>
        
        <div class="flex-1 relative min-h-[350px]">
          <canvas ref="chartCanvas"></canvas>
          
          <!-- Empty State for Chart -->
          <div v-if="!hasChartData" class="absolute inset-0 flex flex-col items-center justify-center text-center bg-white/80 backdrop-blur-[1px]">
            <div class="bg-gray-50 p-4 rounded-full mb-4">
              <i class="ph-bold ph-chart-line-up text-gray-300 text-4xl"></i>
            </div>
            <p class="text-gray-400 font-bold">이번 분기 활동 데이터가 없습니다.</p>
          </div>
        </div>
      </div>

      <!-- Rankings Section -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Weekly Ranking -->
        <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-black text-gray-800 flex items-center gap-2">
              <i class="ph-bold ph-medal text-amber-500"></i>
              이번 주차 랭킹 (Top 3)
            </h3>
            <span v-if="currentWeekLabel" class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">{{ currentWeekLabel }}</span>
          </div>
          
          <div class="space-y-3">
            <div v-if="weeklyRanking.length === 0" class="py-12 text-center text-gray-400 font-bold">
              이번 주 인증 데이터가 없습니다.
            </div>
            <div v-for="item in weeklyRanking" :key="item.memberId" class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-all">
              <div class="flex items-center gap-4">
                <div class="w-8 h-8 flex items-center justify-center rounded-full font-black text-sm shadow-sm" :class="getRankClass(item.rank - 1)">
                  {{ item.rank }}
                </div>
                <span class="font-bold text-gray-900">{{ item.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-lg font-black text-indigo-600">{{ item.count }}</span>
                <span class="text-xs font-bold text-gray-400 uppercase">회</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Quarterly Ranking -->
        <div class="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm flex flex-col">
          <div class="flex items-center justify-between mb-6">
            <h3 class="text-lg font-black text-gray-800 flex items-center gap-2">
              <i class="ph-bold ph-trophy text-indigo-500"></i>
              이번 분기 누적 랭킹 (Top 3)
            </h3>
            <span class="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-widest">{{ currentQuarterLabel }}</span>
          </div>

          <div class="space-y-3">
            <div v-if="quarterlyRanking.length === 0" class="py-12 text-center text-gray-400 font-bold">
              이번 분기 누적 데이터가 없습니다.
            </div>
            <div v-for="item in quarterlyRanking" :key="item.memberId" class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-all">
              <div class="flex items-center gap-4">
                <div class="w-8 h-8 flex items-center justify-center rounded-full font-black text-sm shadow-sm" :class="getRankClass(item.rank - 1)">
                  {{ item.rank }}
                </div>
                <span class="font-bold text-gray-900">{{ item.name }}</span>
              </div>
              <div class="flex items-center gap-2">
                <span class="text-lg font-black text-indigo-600">{{ item.count }}</span>
                <span class="text-xs font-bold text-gray-400 uppercase">회 누적</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue';
import { useStore } from '../composables/useStore';

const { dashboardSummary, currentView, weeks, workoutRecords, members, activeMembers } = useStore();
const isRefreshing = ref(false);
const chartCanvas = ref(null);
let chartInstance = null;

// Helper: Calculate joint rankings for top 3 slots
const calculateTop3Ranks = (list) => {
  if (list.length === 0) return [];
  
  // Sort descending by count
  const sorted = [...list].sort((a, b) => b.count - a.count);
  
  const ranked = [];
  let currentRank = 1;

  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && sorted[i].count < sorted[i-1].count) {
      currentRank = i + 1;
    }
    
    // Joint ranks: if we already have 3 or more items and this is a lower count, stop.
    if (currentRank > 3) break;
    
    ranked.push({ ...sorted[i], rank: currentRank });
  }
  return ranked;
};

const currentWeekLabel = computed(() => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentWeek = weeks.value.find(w => todayStr >= w.start_date && todayStr <= w.end_date);
  return currentWeek ? `${currentWeek.month}월 ${currentWeek.week_number}주차` : null;
});

const currentQuarterLabel = computed(() => {
  const month = new Date().getMonth() + 1;
  const quarter = Math.ceil(month / 3);
  return `${new Date().getFullYear()} Q${quarter}`;
});

// Ranking Calculation Logic (Top 3 with ties)
const weeklyRanking = computed(() => {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const currentWeek = weeks.value.find(w => todayStr >= w.start_date && todayStr <= w.end_date);
  if (!currentWeek) return [];

  const rawCounts = members.value.map(m => {
    const record = workoutRecords.value.find(r => 
      r.member_id === m.id &&
      String(r.year) === String(currentWeek.year) &&
      String(r.month) === String(currentWeek.month) &&
      String(r.week_number) === String(currentWeek.week_number)
    );
    return { memberId: m.id, name: m.name, count: record ? Number(record.count) : 0 };
  }).filter(i => i.count > 0);

  return calculateTop3Ranks(rawCounts);
});

const quarterlyRanking = computed(() => {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);
  
  const rawCounts = members.value.map(m => {
    const totalCount = workoutRecords.value
      .filter(r => {
        if (r.member_id !== m.id) return false;
        const isSameYear = Number(r.year) === currentYear;
        const rQuarter = Math.ceil(Number(r.month) / 3);
        return isSameYear && rQuarter === currentQuarter;
      })
      .reduce((sum, r) => sum + (Number(r.count) || 0), 0);
    
    return { memberId: m.id, name: m.name, count: totalCount };
  }).filter(i => i.count > 0);

  return calculateTop3Ranks(rawCounts);
});

const getRankClass = (index) => {
  if (index === 0) return 'bg-amber-100 text-amber-600 border border-amber-200';
  if (index === 1) return 'bg-slate-100 text-slate-500 border border-slate-200';
  if (index === 2) return 'bg-orange-50 text-orange-600 border border-orange-100';
  return 'bg-gray-100 text-gray-500 border border-gray-200';
};

const hasChartData = computed(() => {
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);
  const currentYear = new Date().getFullYear();
  
  return weeks.value.some(w => Number(w.year) === currentYear && Math.ceil(Number(w.month) / 3) === currentQuarter);
});

const fullReload = () => {
  window.location.reload();
};

const initChart = () => {
  if (!chartCanvas.value || !hasChartData.value) return;

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const currentQuarter = Math.ceil(currentMonth / 3);
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // 1. Get weeks in the current quarter (ascending) up to TODAY
  const quarterWeeks = weeks.value
    .filter(w => {
      const q = Math.ceil(Number(w.month) / 3);
      const isCurrentQuarter = Number(w.year) === currentYear && q === currentQuarter && Number(w.week_number) !== 0;
      // ONLY show weeks that have started or are past
      return isCurrentQuarter && w.start_date <= todayStr;
    })
    .sort((a, b) => new Date(a.start_date) - new Date(b.start_date));

  if (quarterWeeks.length === 0) return;

  const labels = quarterWeeks.map(w => `${w.month}/${w.week_number}주`);
  
  // 2. Prepare datasets (Cumulative per member)
  const membersWithCumulative = activeMembers.value.map(m => {
    let runningTotal = 0;
    const weeklyData = [];
    const cumulativeData = quarterWeeks.map(w => {
      const record = workoutRecords.value.find(r => 
        r.member_id === m.id && 
        String(r.year) === String(w.year) && 
        String(r.month) === String(w.month) && 
        String(r.week_number) === String(w.week_number)
      );
      const weeklyCount = (record ? Number(record.count) : 0);
      weeklyData.push(weeklyCount);
      runningTotal += weeklyCount;
      return runningTotal;
    });
    return { member: m, cumulativeData, weeklyData, finalTotal: runningTotal };
  }).filter(item => item.finalTotal > 0);

  // SORT by finalTotal Descending
  membersWithCumulative.sort((a, b) => b.finalTotal - a.finalTotal);

  // 20+ High Contrast Colors
  const colors = [
    '#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', 
    '#8b5cf6', '#ef4444', '#06b6d4', '#f97316', '#a855f7',
    '#1e1b4b', '#be123c', '#ca8a04', '#15803d', '#1d4ed8',
    '#6d28d9', '#b91c1c', '#0e7490', '#c2410c', '#7e22ce'
  ];

  const datasets = membersWithCumulative.map((item, i) => {
    const color = colors[i % colors.length];
    return {
      label: item.member.name,
      data: item.cumulativeData,
      weeklyData: item.weeklyData,
      borderColor: color,
      backgroundColor: color,
      borderWidth: 5,
      tension: 0, // STRAIGHT LINES
      pointRadius: 4,
      pointHoverRadius: 8,
      hidden: false
    };
  });

  if (chartInstance) chartInstance.destroy();

  chartInstance = new Chart(chartCanvas.value, {
    type: 'line',
    data: {
      labels: labels,
      datasets: datasets
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            boxWidth: 10,
            padding: 20,
            font: { weight: 'bold', size: 11 },
            usePointStyle: true,
            pointStyle: 'circle'
          },
          onClick: (e, legendItem, legend) => {
            const index = legendItem.datasetIndex;
            const ci = legend.chart;
            const dataset = ci.data.datasets[index];
            const baseColor = colors[index % colors.length];

            // Toggle: Highlight (borderWidth 5, solid) vs Dim (borderWidth 1.5, transparent)
            if (dataset.borderWidth === 5) {
              dataset.borderWidth = 1.5;
              dataset.borderColor = baseColor + '26'; // Approx 15% opacity
              dataset.backgroundColor = baseColor + '26';
              dataset.pointRadius = 0;
            } else {
              dataset.borderWidth = 5;
              dataset.borderColor = baseColor;
              dataset.backgroundColor = baseColor;
              dataset.pointRadius = 4;
            }
            ci.update();
          }
        },
        tooltip: {
          backgroundColor: '#1e1b4b',
          padding: 12,
          titleFont: { size: 14, weight: 'bold' },
          bodyFont: { size: 13 },
          callbacks: {
            label: (context) => {
              const weekly = context.dataset.weeklyData[context.dataIndex];
              return `${context.dataset.label}: 누적 ${context.raw}회 (+${weekly}회)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f1f5f9' },
          ticks: { font: { weight: 'bold' }, color: '#94a3b8' },
          title: { display: true, text: '누적 인증 횟수', font: { weight: 'bold' } }
        },
        x: {
          grid: { display: false },
          ticks: { font: { weight: 'bold' }, color: '#64748b' }
        }
      }
    }
  });
};

onMounted(() => {
  nextTick(() => {
    initChart();
  });
});

watch([weeks, workoutRecords, activeMembers], () => {
  initChart();
}, { deep: true });
</script>
