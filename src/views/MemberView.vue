<template>
  <div class="space-y-0">
    <!-- Unified Header Section (Sticky) -->
    <div class="sticky top-16 z-30 bg-white">
      <!-- Page Title & Primary Actions (Indigo Style) -->
      <div class="px-6 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between bg-indigo-50/30 rounded-t-3xl border-t border-x border-gray-100 gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
            <i class="ph-bold ph-users-three text-xl"></i>
          </div>
          <h2 class="text-xl font-black text-gray-900 tracking-tight">회원 관리</h2>
        </div>
        
        <div class="flex items-center gap-3 sm:gap-4">
          <!-- Show Disabled Filter -->
          <label class="flex items-center gap-2 cursor-pointer group">
            <div class="relative flex items-center">
              <input 
                v-model="showDisabled"
                type="checkbox" 
                class="peer h-5 w-5 cursor-pointer appearance-none rounded border border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-all shadow-sm"
              />
              <i class="ph-bold ph-check absolute text-white opacity-0 peer-checked:opacity-100 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-xs pointer-events-none"></i>
            </div>
            <span class="text-xs font-black text-gray-500 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">비활성 회원 포함</span>
          </label>

          <button @click="openAddModal" class="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95">
            <i class="ph-bold ph-plus text-lg"></i>
            <span class="font-black text-sm">회원 등록</span>
          </button>
        </div>
      </div>

      <!-- List Header (Sticky Bottom Part) -->
      <div class="bg-gray-50/95 backdrop-blur-sm pt-6 px-6 pb-3 border-x border-gray-100">
        <div class="hidden md:grid grid-cols-12 gap-4 px-8 py-3 bg-gray-100 rounded-xl text-[11px] font-black text-gray-400 uppercase tracking-widest shadow-sm border border-gray-200">
          <div class="col-span-3">이름</div>
          <div class="col-span-4">이메일</div>
          <div class="col-span-2 text-center">상태</div>
          <div class="col-span-3 text-right">가입일</div>
        </div>
      </div>
    </div>

    <!-- Member List Content Area -->
    <div class="bg-gray-50/50 border-x border-b border-gray-100 rounded-b-3xl overflow-hidden min-h-[400px]">
      <div class="px-6 pb-6 space-y-3 pt-1">
        <div 
          v-for="member in filteredMembers" 
          :key="member.id" 
          @click="openEditModal(member)"
          class="bg-white p-5 md:px-8 md:py-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-4"
        >
          <!-- Name -->
          <div class="md:col-span-3 flex items-center gap-3">
            <span class="font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors">{{ member.name }}</span>
          </div>

          <!-- Email -->
          <div class="md:col-span-4 flex items-center gap-2">
            <span class="md:hidden text-[10px] font-black text-gray-400 uppercase w-16 shrink-0">이메일</span>
            <span class="text-sm font-medium text-gray-500 truncate">{{ member.email || '-' }}</span>
          </div>

          <!-- Status -->
          <div class="md:col-span-2 flex items-center md:justify-center gap-2">
            <span class="md:hidden text-[10px] font-black text-gray-400 uppercase w-16 shrink-0">상태</span>
            <span 
              class="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight shadow-sm border"
              :class="member.enabled ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-gray-50 text-gray-400 border-gray-200'"
            >
              {{ member.enabled ? 'Active' : 'Disabled' }}
            </span>
          </div>

          <!-- Date -->
          <div class="md:col-span-3 flex items-center md:justify-end gap-2">
            <span class="md:hidden text-[10px] font-black text-gray-400 uppercase w-16 shrink-0">가입일</span>
            <span class="text-sm font-bold text-gray-600 font-mono">{{ formatDate(member.created_at) }}</span>
            <i class="ph-bold ph-caret-right text-gray-300 md:hidden ml-auto"></i>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="filteredMembers.length === 0" class="py-24 text-center">
          <div class="inline-flex p-5 rounded-full bg-white shadow-sm border border-gray-100 mb-4">
            <i class="ph-bold ph-users-three text-gray-300 text-5xl"></i>
          </div>
          <p class="text-gray-400 font-black text-lg">표시할 회원이 없습니다.</p>
        </div>
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
const searchQuery = ref('');
const isModalOpen = ref(false);
const selectedMember = ref(null);

// Filter logic
const filteredMembers = computed(() => {
  let list = members.value;
  
  // 1. Status Filter
  if (!showDisabled.value) {
    list = list.filter(m => m.enabled === true || m.enabled === 'TRUE' || m.enabled === 'true');
  }

  // 2. Search Filter
  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(m => 
      (m.name || '').toLowerCase().includes(q) || 
      (m.email || '').toLowerCase().includes(q)
    );
  }

  return list;
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

const downloadCsv = () => {
  const data = filteredMembers.value;
  if (data.length === 0) return;

  const headers = ['이름', '이메일', '상태', '가입일'];
  const rows = data.map(m => [
    m.name,
    m.email || '',
    m.enabled ? '활동' : '비활동',
    formatDate(m.created_at)
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(r => r.join(','))
  ].join('\n');

  const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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
