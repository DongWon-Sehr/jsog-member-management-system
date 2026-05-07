<template>
  <div class="min-h-screen flex flex-col w-full">
    <!-- Common Header (Responsive) -->
    <LayoutHeader :currentView="currentView" @navigate="currentView = $event" />

    <!-- Main Content Area (Responsive margins) -->
    <main class="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 w-full transition-all duration-300">
      <transition 
        name="fade" 
        mode="out-in"
      >
        <!-- Use the global currentView to decide what to show -->
        <component :is="activeComponent" />
      </transition>
    </main>

    <!-- Global Loading Overlay with Animated Phrases -->
    <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-[100] backdrop-blur-md">
      <div class="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-6 max-w-[90%] text-center transform transition-all animate-in fade-in zoom-in duration-300">
        <div class="relative">
          <i class="ph-bold ph-circle-notch animate-spin text-indigo-600 text-6xl"></i>
          <i class="ph-fill ph-person-simple-run absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-400 text-2xl"></i>
        </div>
        <div class="flex flex-col items-center gap-2">
          <span class="font-black text-gray-900 text-xl tracking-tight">주삼오공 Admin</span>
          <transition name="slide-up" mode="out-in">
            <span :key="loadingText" class="text-indigo-600 font-medium h-6">{{ loadingText }}</span>
          </transition>
        </div>
      </div>
    </div>

    <!-- Persistent Footer -->
    <footer class="p-6 bg-gray-50 text-gray-400 text-[10px] sm:text-xs font-bold text-center border-t border-gray-100">
      Made with ♥︎ By 🐟 | © 2026 주삼오공
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import LayoutHeader from './components/LayoutHeader.vue';
import { useStore } from './composables/useStore';
import { useGas } from './composables/useGas';

// Views
import Dashboard from './views/DashboardView.vue';
import Members from './views/MemberView.vue';
import WorkoutRecords from './views/WorkoutView.vue';
import Rewards from './views/RewardView.vue';
import Logs from './views/LogView.vue';

const { members, activeMembers, rewards, weeks, dashboardSummary, isLoading, loadingText, LOADING_PHRASES, currentView } = useStore();
const { call } = useGas();

const phraseInterval = ref(null);

const components = {
  Dashboard,
  Members,
  WorkoutRecords,
  Rewards,
  Logs
};

const activeComponent = computed(() => components[currentView.value]);

/**
 * Start rotating loading phrases for better UX
 */
const startLoadingAnimation = () => {
  let index = 0;
  loadingText.value = LOADING_PHRASES[0];
  phraseInterval.value = setInterval(() => {
    index = (index + 1) % LOADING_PHRASES.length;
    loadingText.value = LOADING_PHRASES[index];
  }, 2000);
};

const stopLoadingAnimation = () => {
  if (phraseInterval.value) {
    clearInterval(phraseInterval.value);
    phraseInterval.value = null;
  }
};

/**
 * Parallel Data Loading Strategy
 */
const loadData = async () => {
  isLoading.value = true;
  startLoadingAnimation();

  const allMembersPromise = new Promise((resolve) => {
    google.script.run
      .withSuccessHandler((res) => {
        if (res && res.success) members.value = res.data;
        resolve();
      })
      .apiGetAllMembers();
  });

  const activeMembersPromise = new Promise((resolve) => {
    google.script.run
      .withSuccessHandler((res) => {
        if (res && res.success) activeMembers.value = res.data;
        resolve();
      })
      .apiGetActiveMembers();
  });

  const rewardsPromise = new Promise((resolve) => {
    google.script.run
      .withSuccessHandler((res) => {
        if (res && res.success) rewards.value = res.data;
        resolve();
      })
      .apiGetAllRewards();
  });

  const summaryPromise = new Promise((resolve) => {
    google.script.run
      .withSuccessHandler((res) => {
        if (res && res.success) Object.assign(dashboardSummary, res.data);
        resolve();
      })
      .apiGetDashboardSummary();
  });

  const weeksPromise = new Promise((resolve) => {
    google.script.run
      .withSuccessHandler((res) => {
        if (res && res.success) weeks.value = res.data;
        resolve();
      })
      .apiGetAllWeeks();
  });

  await Promise.all([
    allMembersPromise,
    activeMembersPromise,
    rewardsPromise,
    summaryPromise,
    weeksPromise
  ]);

  stopLoadingAnimation();
  isLoading.value = false;
};

onMounted(() => {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    loadData();
  } else {
    // Local development fallback
    isLoading.value = true;
    startLoadingAnimation();
    setTimeout(() => { 
      stopLoadingAnimation();
      isLoading.value = false; 
    }, 1500);
  }
});

onUnmounted(() => {
  stopLoadingAnimation();
});
</script>

<style>
/* Global Styles for GAS compatibility */
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease-out;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Hide scrollbar for mobile nav */
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>