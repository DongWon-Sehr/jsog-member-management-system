<template>
  <Teleport to="body">
    <transition name="auth-fade">
      <div v-if="!isAuthenticated" class="fixed inset-0 z-[200] flex items-center justify-center bg-indigo-900/95 backdrop-blur-xl p-4">
        <div class="bg-white rounded-[40px] shadow-2xl w-full max-w-sm overflow-hidden flex flex-col items-center p-10 space-y-8 transform transition-all border border-indigo-100/20">
          
          <!-- Logo / Header -->
          <div class="flex flex-col items-center space-y-4">
            <div class="p-5 bg-indigo-50 text-indigo-600 rounded-3xl shadow-inner animate-pulse">
              <i class="ph-bold ph-shield-check text-5xl"></i>
            </div>
            <div class="text-center">
              <h2 class="text-2xl font-black text-gray-900 tracking-tight">관리자 인증</h2>
              <p class="text-gray-400 font-bold text-sm mt-1 uppercase tracking-widest">Authorized Access Only</p>
            </div>
          </div>

          <!-- PIN Display -->
          <div class="flex gap-4">
            <div 
              v-for="i in 4" :key="i"
              class="w-4 h-4 rounded-full transition-all duration-200"
              :class="pin.length >= i ? 'bg-indigo-600 scale-125' : 'bg-gray-200'"
            ></div>
          </div>

          <!-- Message -->
          <p v-if="error" class="text-red-500 font-black text-sm animate-bounce">{{ error }}</p>
          <p v-else class="text-gray-400 font-bold text-sm">PIN 번호 4자리를 입력해주세요.</p>

          <!-- Keypad -->
          <div class="grid grid-cols-3 gap-4 w-full">
            <button 
              v-for="n in [1,2,3,4,5,6,7,8,9]" :key="n"
              @click="press(n)"
              class="h-16 rounded-2xl bg-gray-50 text-xl font-black text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 active:scale-90 transition-all shadow-sm border border-gray-100"
            >
              {{ n }}
            </button>
            <button @click="clear" class="h-16 rounded-2xl bg-gray-50 text-gray-400 hover:text-red-500 transition-all active:scale-90 flex items-center justify-center border border-gray-100">
              <i class="ph-bold ph-x text-2xl"></i>
            </button>
            <button @click="press(0)" class="h-16 rounded-2xl bg-gray-50 text-xl font-black text-gray-700 hover:bg-indigo-50 active:scale-90 transition-all border border-gray-100 shadow-sm">
              0
            </button>
            <button @click="backspace" class="h-16 rounded-2xl bg-gray-50 text-gray-400 hover:text-indigo-600 transition-all active:scale-90 flex items-center justify-center border border-gray-100">
              <i class="ph-bold ph-backspace text-2xl"></i>
            </button>
          </div>

        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  isAuthenticated: Boolean
});

const emit = defineEmits(['auth-success']);

const pin = ref('');
const error = ref('');
const isValidating = ref(false);

const press = (n) => {
  if (pin.value.length < 4 && !isValidating.value) {
    pin.value += n;
    error.value = '';
  }
};

const clear = () => {
  pin.value = '';
  error.value = '';
};

const backspace = () => {
  if (!isValidating.value) pin.value = pin.value.slice(0, -1);
};

watch(pin, (newVal) => {
  if (newVal.length === 4) {
    isValidating.value = true;
    
    // Server-side validation
    google.script.run
      .withSuccessHandler((res) => {
        isValidating.value = false;
        if (res && res.success && res.isValid) {
          emit('auth-success');
        } else {
          error.value = 'PIN 번호가 일치하지 않습니다.';
          pin.value = '';
        }
      })
      .withFailureHandler(() => {
        isValidating.value = false;
        error.value = '서버 연결 오류';
        pin.value = '';
      })
      .apiValidatePin(newVal);
  }
});
</script>

<style scoped>
.auth-fade-enter-active, .auth-fade-leave-active {
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.auth-fade-enter-from, .auth-fade-leave-to {
  opacity: 0;
  transform: scale(1.1);
  filter: blur(20px);
}
</style>
