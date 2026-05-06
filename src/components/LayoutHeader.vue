<template>
  <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16 items-center">
        <div class="flex items-center">
          <div class="flex-shrink-0 flex items-center gap-2">
            <div class="bg-indigo-600 p-2 rounded-lg flex items-center justify-center">
              <i class="ph-bold ph-person-simple-run text-white text-xl"></i>
            </div>
            <span class="text-xl font-bold text-gray-900 tracking-tight">주삼오공 <span class="text-indigo-600">Admin</span></span>
          </div>
          <nav class="hidden md:ml-8 md:flex md:space-x-4">
            <button 
              v-for="item in navigation" 
              :key="item.name"
              @click="$emit('navigate', item.id)"
              class="px-3 py-2 rounded-md text-sm font-medium transition-colors"
              :class="currentView === item.id ? 'bg-indigo-50 text-indigo-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'"
            >
              {{ item.name }}
            </button>
          </nav>
        </div>
        <div class="flex items-center gap-4">
          <span class="text-xs text-gray-400 font-mono hidden sm:inline-block">V1.0.0</span>
          <div class="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
            <i class="ph-bold ph-user text-gray-500"></i>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Mobile Navigation -->
    <div class="md:hidden border-t border-gray-100 px-2 py-3 flex overflow-x-auto space-x-2 scrollbar-hide">
      <button 
        v-for="item in navigation" 
        :key="item.name"
        @click="$emit('navigate', item.id)"
        class="flex-none px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap"
        :class="currentView === item.id ? 'bg-indigo-600 text-white shadow-sm' : 'bg-gray-100 text-gray-600'"
      >
        {{ item.name }}
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({
  currentView: String
});

defineEmits(['navigate']);

const navigation = [
  { name: '대시보드', id: 'Dashboard' },
  { name: '회원 관리', id: 'Members' },
  { name: '운동 기록', id: 'WorkoutRecords' },
  { name: '리워드 관리', id: 'Rewards' },
  { name: '시스템 로그', id: 'Logs' }
];
</script>

<style scoped>
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
</style>
