<template>
  <Teleport to="body">
    <transition name="modal">
      <!-- backdrop z-index increased and explicit inset-0 to avoid gap -->
      <div v-if="isOpen" class="fixed inset-0 z-[100] overflow-y-auto flex items-center justify-center backdrop-blur-sm bg-black/40 p-4 sm:p-0">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-md transform transition-all overflow-hidden border border-gray-100">
          <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-indigo-50/30">
          <h3 class="text-xl font-black text-gray-900 flex items-center gap-2">
            <i :class="isEditMode ? 'ph-bold ph-pencil-simple' : 'ph-bold ph-user-plus'" class="text-indigo-600"></i>
            {{ isEditMode ? '회원 정보 수정' : '신규 회원 등록' }}
          </h3>
        </div>

        <!-- Body -->
        <div class="px-8 py-8 space-y-6">
          <div class="space-y-1.5">
            <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">이름</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i class="ph-fill ph-user text-gray-300 group-focus-within:text-indigo-500 transition-colors"></i>
              </div>
              <input 
                v-model="form.name"
                type="text" 
                placeholder="닉네임을 입력하세요"
                class="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
              />
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">이메일 (선택)</label>
            <div class="relative group">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <i class="ph-fill ph-envelope-simple text-gray-300 group-focus-within:text-indigo-500 transition-colors"></i>
              </div>
              <input 
                v-model="form.email"
                type="email" 
                placeholder="example@email.com"
                class="w-full pl-11 pr-4 py-3.5 bg-gray-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-900 shadow-inner"
              />
            </div>
          </div>

          <!-- Status Toggle (Only in Edit Mode) -->
          <div v-if="isEditMode" class="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 shadow-inner">
            <div class="flex flex-col justify-center">
              <p class="text-sm font-black text-gray-900">활동 상태</p>
              <p class="text-xs text-gray-400 font-medium">{{ form.enabled ? '현재 활동 중입니다' : '현재 비활성 상태입니다' }}</p>
            </div>
            <!-- Robust Toggle: Using absolute positioning for perfect alignment -->
            <button 
              @click="form.enabled = !form.enabled"
              class="relative block h-7 w-12 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 ease-in-out focus:outline-none ring-offset-2 focus:ring-2 ring-blue-500"
              :class="form.enabled ? 'bg-blue-600' : 'bg-gray-300'"
            >
              <span 
                class="absolute top-1 pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-all duration-200 ease-in-out"
                :class="form.enabled ? 'left-6' : 'left-1'"
              ></span>
            </button>
          </div>
        </div>

        <!-- Footer -->
        <div class="px-6 py-6 bg-gray-50/50 flex gap-3">
          <button @click="close" class="flex-1 py-4 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black shadow-sm hover:bg-gray-100 transition-all active:scale-95 text-sm sm:text-base">닫기</button>
          <button @click="save" class="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95 text-sm sm:text-base">저장하기</button>
        </div>
      </div>
    </div>
    </transition>
    </Teleport>
    </template>
<script setup>
import { ref, reactive, watch, onMounted, onUnmounted } from 'vue';
import { useDialog } from '../composables/useDialog';

const props = defineProps({
  isOpen: Boolean,
  memberData: Object
});

const emit = defineEmits(['close', 'save']);
const { alert } = useDialog();

const isEditMode = ref(false);
const form = reactive({
  id: '',
  name: '',
  email: '',
  enabled: true
});

const handleEsc = (e) => {
  if (e.key === 'Escape' && props.isOpen) close();
};

onMounted(() => window.addEventListener('keydown', handleEsc));
onUnmounted(() => window.removeEventListener('keydown', handleEsc));

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
    alert({ message: '이름을 입력해주세요.', isDanger: true });
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