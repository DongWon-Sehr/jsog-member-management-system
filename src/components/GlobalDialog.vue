<template>
  <Teleport to="body">
    <transition name="dialog-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-200">
        <!-- Dim overlay -->
        <div class="absolute inset-0 bg-gray-900/40"></div>
        
        <!-- Dialog box -->
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden transform transition-all duration-200 scale-100 opacity-100 flex flex-col">
          <!-- Body -->
          <div class="p-6 pb-4 sm:p-8 sm:pb-6 text-center">
            <div class="mx-auto flex items-center justify-center w-14 h-14 rounded-full mb-4" :class="isDanger ? 'bg-red-50 text-red-500' : 'bg-indigo-50 text-indigo-600'">
              <i class="text-3xl" :class="isDanger ? 'ph-fill ph-warning-circle' : (dialogType === 'confirm' ? 'ph-fill ph-question' : 'ph-fill ph-info')"></i>
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-2" v-if="title">{{ title }}</h3>
            <p class="text-gray-500 text-sm font-medium whitespace-pre-wrap leading-relaxed">{{ message }}</p>
          </div>
          
          <!-- Actions -->
          <div class="p-4 sm:px-8 sm:pb-8 flex gap-3 mt-auto">
            <button 
              v-if="dialogType === 'confirm'" 
              @click="handleCancel" 
              class="flex-1 py-3 px-4 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl transition-all active:scale-95"
            >
              {{ cancelText }}
            </button>
            <button 
              @click="handleConfirm" 
              class="flex-1 py-3 px-4 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
              :class="isDanger ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200'"
            >
              {{ confirmText }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';
import { useDialog } from '../composables/useDialog';
import { useScrollLock } from '../composables/useScrollLock';
const { isOpen, dialogType, title, message, confirmText, cancelText, isDanger, handleConfirm, handleCancel } = useDialog();

useScrollLock(isOpen);

const handleEsc = (e) => {
  if (e.key === 'Escape' && isOpen.value) {
    if (dialogType.value === 'alert') {
      handleConfirm();
    } else {
      handleCancel();
    }
  }
};

onMounted(() => window.addEventListener('keydown', handleEsc));
onUnmounted(() => window.removeEventListener('keydown', handleEsc));
</script>

<style scoped>
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
