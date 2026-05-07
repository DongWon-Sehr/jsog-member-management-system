<template>
  <div class="space-y-6">
    <!-- Filter and Header Section -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
      <h2 class="text-2xl font-bold text-gray-800">회원 관리</h2>
      
      <div class="flex items-center gap-4">
        <!-- Show Disabled Filter -->
        <label class="flex items-center gap-2 cursor-pointer group">
          <div class="relative flex items-center">
            <input 
              v-model="showDisabled"
              type="checkbox" 
              class="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-all"
            />
            <i class="ph-bold ph-check absolute text-white opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs pointer-events-none"></i>
          </div>
          <span class="text-sm font-bold text-gray-500 group-hover:text-indigo-600 transition-colors uppercase tracking-tighter">비활성 회원 포함</span>
        </label>

        <button @click="openAddModal" class="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
          <i class="ph-bold ph-plus text-lg"></i>
          <span class="font-bold text-sm">회원 등록</span>
        </button>
      </div>
    </div>

    <!-- Member Table / Mobile List View -->
    <div class="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
      <!-- Desktop Table -->
      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-100">
          <thead class="bg-gray-50/50 text-gray-400">
            <tr>
              <th class="px-8 py-5 text-left text-[11px] font-black uppercase tracking-widest">이름</th>
              <th class="px-8 py-5 text-left text-[11px] font-black uppercase tracking-widest">이메일</th>
              <th class="px-8 py-5 text-left text-[11px] font-black uppercase tracking-widest">상태</th>
              <th class="px-8 py-5 text-left text-[11px] font-black uppercase tracking-widest">가입일</th>
              <th class="px-8 py-5 text-right text-[11px] font-black uppercase tracking-widest">수정</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-50">
            <tr v-for="member in filteredMembers" :key="member.id" class="hover:bg-indigo-50/30 transition-colors group">
              <td class="px-8 py-5 whitespace-nowrap">
                <div class="font-bold text-gray-900 text-base">{{ member.name }}</div>
              </td>
              <td class="px-8 py-5 whitespace-nowrap text-gray-400 text-sm">
                {{ member.email || '-' }}
              </td>
              <td class="px-8 py-5 whitespace-nowrap">
                <span 
                  class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter"
                  :class="member.enabled ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-50 text-gray-400 border border-gray-100'"
                >
                  {{ member.enabled ? 'Active' : 'Disabled' }}
                </span>
              </td>
              <td class="px-8 py-5 whitespace-nowrap text-sm text-gray-300 font-mono">
                {{ formatDate(member.created_at) }}
              </td>
              <td class="px-8 py-5 whitespace-nowrap text-right">
                <button @click="openEditModal(member)" class="p-3 hover:bg-white rounded-xl text-indigo-600 shadow-sm border border-transparent hover:border-indigo-100 transition-all opacity-0 group-hover:opacity-100">
                  <i class="ph-bold ph-pencil-simple text-2xl"></i>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile List View -->
      <div class="md:hidden divide-y divide-gray-100">
        <div 
          v-for="member in filteredMembers" 
          :key="member.id" 
          @click="openEditModal(member)"
          class="p-5 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100 transition-colors cursor-pointer"
        >
          <div class="flex items-center gap-4">
            <div>
              <div class="font-bold text-gray-900 text-base">{{ member.name }}</div>
              <div class="text-xs text-gray-400">{{ member.email || '이메일 없음' }}</div>
            </div>
          </div>
          <div class="flex flex-col items-end gap-2">
            <span class="text-[9px] font-black uppercase px-2 py-0.5 rounded-md border"
              :class="member.enabled ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-gray-50 text-gray-300 border-gray-100'">
              {{ member.enabled ? 'On' : 'Off' }}
            </span>
            <i class="ph-bold ph-caret-right text-gray-300"></i>
          </div>
        </div>
      </div>

      <div v-if="filteredMembers.length === 0" class="px-6 py-20 text-center bg-gray-50/30">
        <div class="inline-flex p-4 rounded-full bg-gray-100 mb-4">
          <i class="ph-bold ph-users-three text-gray-300 text-4xl"></i>
        </div>
        <p class="text-gray-400 font-bold">표시할 회원이 없습니다.</p>
      </div>
    </div>

    <!-- Member Modal -->
    <ModalMember 
      :is-open="isModalOpen" 
      :member-data="selectedMember" 
      @close="closeModal" 
      @save="handleSaveMember"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useStore } from '../composables/useStore';
import ModalMember from '../components/ModalMember.vue';

const { members } = useStore();

const showDisabled = ref(false);
const isModalOpen = ref(false);
const selectedMember = ref(null);

// Filter logic
const filteredMembers = computed(() => {
  if (showDisabled.value) return members.value;
  return members.value.filter(m => m.enabled === true || m.enabled === 'TRUE' || m.enabled === 'true');
});

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return String(dateStr).split(' ')[0];
};

// Modal Handlers
const openAddModal = () => {
  selectedMember.value = null;
  isModalOpen.value = true;
};

const openEditModal = (member) => {
  selectedMember.value = member;
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
};

const handleSaveMember = (formData) => {
  const isEdit = !!formData.id;
  
  if (isEdit) {
    const idx = members.value.findIndex(m => m.id === formData.id);
    if (idx !== -1) {
      const oldMember = { ...members.value[idx] };
      members.value[idx] = { ...members.value[idx], ...formData };
      
      google.script.run
        .withFailureHandler(err => {
          console.error('Edit failed:', err);
          members.value[idx] = oldMember;
        })
        .apiUpdateMember(formData.id, { name: formData.name, email: formData.email });
      
      const statusAction = formData.enabled ? 'apiReactivateMember' : 'apiDeactivateMember';
      google.script.run[statusAction](formData.id);
    }
  } else {
    const tempMember = {
      ...formData,
      id: 'temp-' + Date.now(),
      created_at: new Date().toISOString()
    };
    members.value.unshift(tempMember);
    
    google.script.run
      .withSuccessHandler(res => {
        if (res && res.success) {
          const idx = members.value.findIndex(m => m.id === tempMember.id);
          if (idx !== -1) members.value[idx] = res.data;
        }
      })
      .apiAddMember(formData.name, formData.email);
  }

  closeModal();
};
</script>
