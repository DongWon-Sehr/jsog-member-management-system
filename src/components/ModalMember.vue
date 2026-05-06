<template>
  <transition name="modal">
    <!-- backdrop z-index increased and explicit top-0 to avoid gap -->
    <div v-if="isOpen" class="fixed top-0 left-0 w-full h-full z-[100] overflow-y-auto flex items-center justify-center backdrop-blur-sm bg-black/40 p-4 sm:p-0" @click.self="close">
      <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all overflow-hidden border border-gray-100">
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-blue-50/30">
          <h3 class="text-xl font-black text-gray-900 flex items-center gap-2">
            <i :class="isEditMode ? 'ph-bold ph-pencil-simple' : 'ph-bold ph-user-plus'" class="text-blue-600"></i>
            {{ isEditMode ? '회원 정보 수정' : '신규 회원 등록' }}
          </h3>
          <button @click="close" class="p-2 hover:bg-white rounded-full transition-colors text-gray-400 hover:text-gray-600 shadow-sm">
            <i class="ph-bold ph-x text-lg"></i>
          </button>
        </div>

        <!-- Body -->
        <div class="px-8 py-8 space-y-6">
          <div class="space-y-1.5">
            <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">이름</label>
            <div class="relative group">
              <i class="ph-fill ph-user absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors"></i>
              <input 
                v-model="form.name"
                type="text" 
                placeholder="닉네임을 입력하세요"
                class="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">이메일 (선택)</label>
            <div class="relative group">
              <i class="ph-fill ph-envelope-simple absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-blue-500 transition-colors"></i>
              <input 
                v-model="form.email"
                type="email" 
                placeholder="example@email.com"
                class="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
              />
            </div>
          </div>

          <!-- Status Toggle (Only in Edit Mode) -->
          <div v-if="isEditMode" class="pt-2 flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
            <div>
              <p class="text-sm font-black text-gray-900">활동 상태</p>
              <p class="text-xs text-gray-400 font-medium">{{ form.enabled ? '현재 활동 중입니다' : '현재 비활성 상태입니다' }}</p>
            </div>
            <!-- Robust Toggle: Using flex with padding and a circle that fits perfectly -->
            <button 
              @click="form.enabled = !form.enabled"
              class="relative flex h-7 w-12 flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 ease-in-out focus:outline-none ring-offset-2 focus:ring-2 ring-blue-500 px-1"
              :class="form.enabled ? 'bg-blue-600' : 'bg-gray-300'"
            >
              <span 
                class="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out"
                :class="form.enabled ? 'translate-x-5' : 'translate-x-0'"
              ></span>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-6 bg-gray-50/50 flex gap-3">
          <button @click="close" class="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black shadow-sm hover:bg-gray-100 transition-all active:scale-95 text-sm sm:text-base">취소</button>
          <button @click="save" class="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 text-sm sm:text-base">저장하기</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, reactive, watch } from 'vue';

const props = defineProps({
  isOpen: Boolean,
  memberData: Object
});

const emit = defineEmits(['close', 'save']);

const isEditMode = ref(false);
const form = reactive({
  id: '',
  name: '',
  email: '',
  enabled: true
});

watch(() => props.memberData, (newVal) => {
  if (newVal) {
    isEditMode.value = true;
    form.id = newVal.id;
    form.name = newVal.name;
    form.email = newVal.email || '';
    form.enabled = newVal.enabled === true || newVal.enabled === 'TRUE' || newVal.enabled === 'true';
  } else {
    isEditMode.value = false;
    form.id = '';
    form.name = '';
    form.email = '';
    form.enabled = true;
  }
}, { immediate: true });

const close = () => {
  emit('close');
};

const save = () => {
  if (!form.name.trim()) {
    alert('이름을 입력해주세요.');
    return;
  }
  emit('save', { ...form });
};
</script>

<style scoped>
.modal-enter-active, .modal-leave-active {
  transition: all 0.3s ease;
}
.modal-enter-from, .modal-leave-to {
  opacity: 0;
  transform: scale(0.95);
}
</style>
