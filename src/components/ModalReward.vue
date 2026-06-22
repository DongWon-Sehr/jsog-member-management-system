<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="isOpen" class="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 backdrop-blur-sm transition-all duration-300">
        <!-- Dim Overlay -->
        <div class="absolute inset-0 bg-gray-900/60 transition-opacity duration-300"></div>

        <!-- Modal Content -->
        <div class="relative bg-white rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden transform transition-all duration-300 scale-100 opacity-100">
          
          <!-- Processing Overlay -->
          <div v-if="isProcessing" class="absolute inset-0 bg-white/50 backdrop-blur-sm z-50 flex flex-col items-center justify-center rounded-3xl">
            <i class="ph-bold ph-spinner animate-spin text-indigo-600 text-5xl mb-4"></i>
            <span class="text-indigo-800 font-bold">저장 중...</span>
          </div>

          <!-- Header -->
          <div class="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-indigo-50/30">
            <div class="flex items-center gap-3">
              <div class="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <i class="ph-bold text-xl" :class="isEditMode ? 'ph-pencil-simple' : 'ph-gift'"></i>
              </div>
              <h3 class="text-xl font-bold text-gray-900">{{ isEditMode ? '리워드 정보 수정' : '리워드 지급 등록' }}</h3>
            </div>
          </div>

          <!-- Main Body -->
          <div class="p-6 space-y-5">
            <!-- Member Selection -->
            <div class="space-y-1.5">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">지급 대상 회원</label>
              <select 
                v-model="form.memberId"
                class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-gray-900 transition-all"
              >
                <option value="">-- 회원 선택 --</option>
                <option v-for="m in activeMembers" :key="m.id" :value="m.id">{{ m.name }}</option>
              </select>
            </div>

            <!-- Reward Date / Period -->
            <div class="space-y-1.5">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">지급 기간/일자</label>
              <input 
                v-model="form.rewardDate"
                type="text" 
                placeholder="예: 2026-Q1, 2026-05-08"
                class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-gray-900 transition-all"
              />
            </div>

            <!-- Amount -->
            <div class="space-y-1.5">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">금액 (원)</label>
              <input 
                v-model.number="form.amount"
                type="number" 
                placeholder="0"
                class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-gray-900 transition-all"
              />
            </div>

            <!-- Description -->
            <div class="space-y-1.5">
              <label class="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">상세 내용</label>
              <textarea 
                v-model="form.description"
                rows="2"
                placeholder="지급 사유를 입력하세요"
                class="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-bold text-gray-900 transition-all resize-none"
              ></textarea>
            </div>
          </div>

          <!-- Footer -->
          <div class="px-6 py-6 bg-gray-50/50 flex gap-3">
            <button v-if="isEditMode" @click="remove" :disabled="isProcessing" class="px-4 py-3.5 bg-white border border-red-200 text-red-500 rounded-2xl font-black shadow-sm hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50" title="삭제">
              <i class="ph-bold ph-trash text-lg"></i>
            </button>
            <button @click="close" :disabled="isProcessing" class="flex-1 py-3.5 bg-white border border-gray-200 text-gray-600 rounded-2xl font-black shadow-sm hover:bg-gray-100 transition-all active:scale-95">
              닫기
            </button>
            <button @click="save" :disabled="isProcessing || !isValid" class="flex-1 py-3.5 bg-indigo-600 text-white rounded-2xl font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50">
              {{ isEditMode ? '수정 완료' : '지급하기' }}
            </button>
          </div>

        </div>
      </div>
    </transition>
  </Teleport>
</template>

<script setup>
import { toRef } from 'vue';
import { useScrollLock } from '../composables/useScrollLock';
import { reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useStore } from '../composables/useStore';
import { useDialog } from '../composables/useDialog';

const props = defineProps({
  isOpen: Boolean,
  isProcessing: Boolean,
  initialData: Object
});

useScrollLock(toRef(props, 'isOpen'));

const emit = defineEmits(['close', 'save', 'delete']);
const { activeMembers } = useStore();
const { alert } = useDialog();

const form = reactive({
  id: '',
  memberId: '',
  rewardDate: '',
  amount: 0,
  description: ''
});

const isEditMode = computed(() => !!form.id);

const isValid = computed(() => {
  return form.memberId && form.rewardDate && form.amount > 0;
});

const handleEsc = (e) => {
  if (e.key === 'Escape' && props.isOpen && !props.isProcessing) close();
};

const resetForm = () => {
  if (props.initialData) {
    form.id = props.initialData.id || '';
    form.memberId = props.initialData.memberId || '';
    form.rewardDate = props.initialData.rewardDate || new Date().toISOString().split('T')[0];
    form.amount = props.initialData.amount || 0;
    form.description = props.initialData.description || '';
  } else {
    form.id = '';
    form.memberId = '';
    form.rewardDate = new Date().toISOString().split('T')[0];
    form.amount = 0;
    form.description = '';
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleEsc);
  resetForm();
});

watch(() => props.isOpen, (newVal) => {
  if (newVal) resetForm();
});

watch(() => props.initialData, () => {
  resetForm();
}, { deep: true });

onUnmounted(() => window.removeEventListener('keydown', handleEsc));

const close = () => {
  emit('close');
};

const save = () => {
  if (!isValid.value) return;
  emit('save', { ...form });
};

const remove = () => {
  if (!form.id) return;
  emit('delete', form.id);
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
