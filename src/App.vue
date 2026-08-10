<template>
  <div class="min-h-screen flex flex-col w-full transition-all duration-700">
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

    <!-- Global Loading Overlay -->
    <div v-if="isLoading" class="fixed inset-0 bg-black bg-opacity-50 flex flex-col items-center justify-center z-[100] backdrop-blur-md">
      <div class="loading-card bg-white rounded-3xl shadow-2xl flex flex-col items-center justify-center text-center">
        <div class="loading-emoji-stage">
          <transition name="emoji-swap">
            <span :key="loadingEmoji" class="loading-emoji">{{ loadingEmoji }}</span>
          </transition>
        </div>
        <span class="font-black text-gray-900 text-xl tracking-tight">주삼오공 Admin</span>
        <p class="loading-phrase text-indigo-600 font-medium">{{ loadingText }}</p>
      </div>
    </div>

    <!-- Persistent Footer -->
    <footer class="p-6 bg-gray-50 text-gray-400 text-[10px] sm:text-xs font-bold text-center border-t border-gray-100">
      Made with ♥︎ By 🐟 | © 2026 주삼오공
    </footer>

    <!-- Global Dialog -->
    <GlobalDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import LayoutHeader from './components/LayoutHeader.vue';
import GlobalDialog from './components/GlobalDialog.vue';
import { useStore } from './composables/useStore';
import { useGas } from './composables/useGas';

// Views
import Dashboard from './views/DashboardView.vue';
import Members from './views/MemberView.vue';
import WorkoutRecords from './views/WorkoutView.vue';
import Rewards from './views/RewardView.vue';
import Logs from './views/LogView.vue';

const { members, activeMembers, rewards, weeks, workoutRecords, workoutLogs, systemLogs, dashboardSummary, isLoading, loadingText, LOADING_PHRASES, currentView } = useStore();
const { call } = useGas();

const phraseInterval = ref(null);
const LOADING_EMOJIS = ['🏃', '🏋️', '🧘', '🚴', '🏊', '🤸', '🎾', '⚽'];
const loadingEmoji = ref(LOADING_EMOJIS[0]);

const components = {
  Dashboard,
  Members,
  WorkoutRecords,
  Rewards,
  Logs
};

const activeComponent = computed(() => components[currentView.value]);

const startLoadingAnimation = () => {
  let index = 0;
  loadingText.value = LOADING_PHRASES[0];
  loadingEmoji.value = LOADING_EMOJIS[0];
  phraseInterval.value = setInterval(() => {
    index += 1;
    loadingText.value = LOADING_PHRASES[index % LOADING_PHRASES.length];
    loadingEmoji.value = LOADING_EMOJIS[index % LOADING_EMOJIS.length];
  }, 1400);
};

const stopLoadingAnimation = () => {
  if (phraseInterval.value) {
    clearInterval(phraseInterval.value);
    phraseInterval.value = null;
  }
};

const loadData = async () => {
  isLoading.value = true;
  startLoadingAnimation();

  if (typeof google === 'undefined' || !google.script || !google.script.run) {
    console.warn("GAS environment not detected. Initializing with mock data.");
    await new Promise(resolve => setTimeout(resolve, 1000));
    stopLoadingAnimation();
    isLoading.value = false;
    return;
  }

  await new Promise((resolve) => {
    google.script.run
      .withSuccessHandler((res) => {
        if (res && res.success) {
          members.value = res.data.members || [];
          rewards.value = res.data.rewards || [];
          Object.assign(dashboardSummary, res.data.dashboardSummary);
          weeks.value = res.data.weeks || [];
          workoutRecords.value = res.data.workoutRecords || [];
          workoutLogs.value = res.data.workoutLogs || [];
          systemLogs.value = res.data.recentLogs || [];
        }
        resolve();
      })
      .withFailureHandler((err) => {
        console.error("Failed to load initial data:", err);
        resolve();
      })
      .apiLoadInitialData();
  });

  stopLoadingAnimation();
  isLoading.value = false;
};

onMounted(() => {
  if (typeof google !== 'undefined' && google.script && google.script.run) {
    loadData();
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

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* Mirrored in scripts/post-build.js: the GAS build replaces index.html and drops this bundle,
   so the deployed copy of these rules lives in that template. Keep the two in sync. */
.loading-card {
  width: 320px;
  height: 232px;
  padding: 28px 24px;
  gap: 6px;
}

.loading-emoji-stage {
  position: relative;
  width: 72px;
  height: 72px;
  margin-bottom: 10px;
}

.loading-emoji {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 44px;
  line-height: 1;
}

.emoji-swap-enter-active {
  transition: opacity 0.45s ease-out, transform 0.45s cubic-bezier(0.22, 1, 0.36, 1);
}

.emoji-swap-leave-active {
  transition: opacity 0.4s ease-in, transform 0.4s cubic-bezier(0.55, 0, 1, 0.45);
}

.emoji-swap-enter-from {
  opacity: 0;
  transform: translateX(-72px) scale(0.6) rotate(-14deg);
}

.emoji-swap-leave-to {
  opacity: 0;
  transform: translateX(72px) scale(0.6) rotate(14deg);
}

.loading-phrase {
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}
</style>