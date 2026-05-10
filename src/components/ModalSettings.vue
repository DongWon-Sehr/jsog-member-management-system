<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[130] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm transition-all duration-300">
        <div class="absolute inset-0 bg-gray-900/60" @click="close"></div>
        <div class="relative bg-white rounded-[40px] shadow-2xl w-full max-w-sm flex flex-col overflow-hidden transform transition-all duration-300">
          
          <!-- Header -->
          <div class="px-8 py-6 border-b border-gray-100 bg-indigo-50/30 flex flex-col items-center space-y-2">
            <div class="p-3 bg-white text-indigo-600 rounded-2xl shadow-sm border border-indigo-50">
              <i class="ph-bold ph-gear-six text-3xl"></i>
            </div>
            <h3 class="text-xl font-black text-gray-900">시스템 설정</h3>
          </div>

          <!-- Body -->
          <div class="p-8 space-y-6">
            <div class="space-y-2 text-center">
              <p class="text-xs font-black text-gray-400 uppercase tracking-widest">관리자 PIN 변경</p>
              <p class="text-[11px] text-gray-400 font-medium leading-relaxed">새로운 4자리 PIN 번호를 입력해주세요.<br/>기존 번호는 즉시 무효화됩니다.</p>
            </div>

            <div class="flex flex-col items-center space-y-4">
              <!-- PIN Inputs (Visual only, keypad controlled) -->
              <div class="flex gap-4">
                <div 
                  v-for="i in 4" :key="i"
                  class="w-4 h-4 rounded-full transition-all duration-200"
                  :class="newPin.length >= i ? 'bg-indigo-600 scale-125' : 'bg-gray-200'"
                ></div>
              </div>

              <!-- Keypad -->
              <div class="grid grid-cols-3 gap-3 w-full">
                <button 
                  v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n"
                  @click="press(n)"
                  class="h-12 rounded-xl bg-gray-50 text-lg font-black text-gray-700 hover:bg-indigo-50 active:scale-95 transition-all border border-gray-100"
                >
                  {{ n }}
                </button>
                <button @click="clear" class="h-12 rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 active:scale-95 transition-all flex items-center justify-center border border-gray-100">
                  <i class="ph-bold ph-trash text-xl"></i>
                </button>
                <button @click="press(0)" class="h-12 rounded-xl bg-gray-50 text-lg font-black text-gray-700 hover:bg-indigo-50 active:scale-95 transition-all border border-gray-100">
                  0
                </button>
                <button @click="backspace" class="h-12 rounded-xl bg-gray-50 text-gray-400 hover:text-indigo-600 active:scale-95 transition-all flex items-center justify-center border border-gray-100">
                  <i class="ph-bold ph-backspace text-xl"></i>
                </button>
              </div>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-8 py-6 bg-gray-50/50 flex gap-3">
            <button @click="close" :disabled="isProcessing" class="flex-1 py-3.5 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black shadow-sm hover:bg-gray-50 transition-all active:scale-95">
              취소
            </button>
            <button 
              @click="handleUpdatePin" 
              :disabled="isProcessing || newPin.length !== 4" 
              class="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
            >
              <i v-if="isProcessing" class="ph-bold ph-spinner animate-spin"></i>
              <span v-else>변경 완료</span>
            </button>
          </div>

        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue';
import { useDialog } from '../composables/useDialog';

const props = defineProps({
  isOpen: Boolean
});

const emit = defineEmits(['close']);
const { alert } = useDialog();

const newPin = ref('');
const isProcessing = ref(false);

const press = (n) => {
  if (newPin.value.length < 4) newPin.value += n;
};

const clear = () => newPin.value = '';
const backspace = () => newPin.value = newPin.value.slice(0, -1);

const handleUpdatePin = () => {
  if (newPin.value.length !== 4) return;
  
  isProcessing.value = true;
  google.script.run
    .withSuccessHandler((res) => {
      isProcessing.value = false;
      if (res && res.success) {
        alert({ title: '성공', message: 'PIN 번호가 성공적으로 변경되었습니다.' });
        close();
      } else {
        alert({ title: '오류', message: res.message || '변경에 실패했습니다.', isDanger: true });
      }
    })
    .withFailureHandler(() => {
      isProcessing.value = false;
      alert({ title: '오류', message: '서버 요청 중 오류가 발생했습니다.', isDanger: true });
    })
    .apiUpdatePin(newPin.value);
};

const close = () => {
  newPin.value = '';
  emit('close');
};
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
