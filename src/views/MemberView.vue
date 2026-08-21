<template>
  <div class="space-y-0">
    <!-- Unified Header Section (Sticky) -->
    <div class="sticky top-28 md:top-16 z-30 bg-white">
      <!-- Page Title & Primary Actions (Indigo Style) -->
      <div class="px-6 py-5 border-b border-gray-50 flex flex-col sm:flex-row sm:items-center justify-between bg-indigo-50/30 rounded-t-3xl border-t border-x border-gray-100 gap-4">
        <div class="flex items-center gap-3">
          <div class="p-2 bg-indigo-100 text-indigo-600 rounded-xl shadow-sm">
            <i class="ph-bold ph-users-three text-xl"></i>
          </div>
          <h2 class="text-xl font-black text-gray-900 tracking-tight">회원 관리</h2>
          <button @click="isHeaderExpanded = !isHeaderExpanded" class="md:hidden p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" :title="isHeaderExpanded ? '메뉴 접기' : '메뉴 펼치기'">
            <i class="ph-bold" :class="isHeaderExpanded ? 'ph-caret-up' : 'ph-caret-down'"></i>
          </button>
        </div>

        <div class="flex-wrap items-center gap-2 sm:gap-4" :class="isHeaderExpanded ? 'flex' : 'hidden md:flex'">
          <div class="relative group flex-1 min-w-[160px] sm:flex-none">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="ph-bold ph-magnifying-glass text-gray-400 group-focus-within:text-indigo-500 transition-colors"></i>
            </div>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="멤버 이름 검색"
              class="pl-9 pr-4 py-2 bg-white border border-gray-200 focus:border-indigo-500 rounded-xl outline-none text-sm font-bold text-gray-900 shadow-sm transition-all w-full sm:w-48"
            />
          </div>

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
            <span class="text-xs font-black text-gray-500 group-hover:text-indigo-600 transition-colors uppercase tracking-tight whitespace-nowrap">비활성 회원 포함</span>
          </label>

          <button @click="openAddModal" class="inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 shrink-0">
            <i class="ph-bold ph-plus text-lg"></i>
            <span class="font-black text-sm whitespace-nowrap">회원 등록</span>
          </button>

          <button @click="downloadCsv" :disabled="filteredMembers.length === 0" class="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-all shadow-sm active:scale-95 disabled:opacity-50 shrink-0" title="CSV 다운로드">
            <i class="ph-bold ph-download-simple text-gray-500 text-xl"></i>
          </button>
        </div>
      </div>

      <!-- List Header (Sticky Bottom Part) -->
      <div class="bg-gray-50/95 backdrop-blur-sm pt-6 px-6 pb-3 border-x border-gray-100" :class="isHeaderExpanded ? '' : 'hidden md:block'">
        <div class="hidden md:grid grid-cols-12 gap-4 px-8 py-3 bg-gray-100 rounded-xl text-[11px] font-black text-gray-400 uppercase tracking-widest shadow-sm border border-gray-200">
          <div class="col-span-2 text-center">이름</div>
          <div class="col-span-3 text-center">이메일</div>
          <div class="col-span-3 text-center">환급 계좌</div>
          <div class="col-span-2 text-center">상태</div>
          <div class="col-span-2 text-center">가입일</div>
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
          :class="['bg-white p-5 md:px-8 md:py-4 rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-200 transition-all cursor-pointer group flex flex-col md:grid md:grid-cols-12 md:items-center gap-2 md:gap-4', { 'animate-highlight': recentlyAddedIds.includes(member.id) }]"
        >
          <!-- Name -->
          <div class="md:col-span-2 flex items-center md:justify-center gap-3">
            <span class="font-bold text-gray-900 text-base group-hover:text-indigo-600 transition-colors">{{ member.name }}</span>
          </div>

          <!-- Email -->
          <div class="md:col-span-3 flex items-center md:justify-center gap-2 min-w-0">
            <span class="md:hidden text-[10px] font-black text-gray-400 uppercase w-16 shrink-0">이메일</span>
            <span v-if="member.email" class="text-sm font-medium text-gray-500 truncate ">{{ member.email }}</span>
            <span v-else class="text-sm font-medium text-gray-300">미등록</span>
          </div>

          <div class="md:col-span-3 flex items-center md:justify-center gap-2 min-w-0">
            <span class="md:hidden text-[10px] font-black text-gray-400 uppercase w-16 shrink-0">환급 계좌</span>
            <span v-if="member.bank_type || member.bank_account" class="flex items-center gap-2 min-w-0">
              <!-- Fixed width fits the longest bank name so account numbers align across rows -->
              <span class="w-[68px] shrink-0 px-1.5 py-0.5 rounded-md bg-gray-50 border border-gray-100 text-[10px] font-black text-gray-500 text-center truncate ">{{ member.bank_type || '-' }}</span>
              <span class="text-sm font-bold text-gray-600 font-mono truncate ">{{ member.bank_account || '-' }}</span>
            </span>
            <span v-else class="text-sm font-medium text-gray-300">미등록</span>
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
          <div class="md:col-span-2 flex items-center md:justify-center gap-2">
            <span class="md:hidden text-[10px] font-black text-gray-400 uppercase w-16 shrink-0">가입일</span>
            <span class="text-sm font-bold text-gray-600 font-mono">{{ formatDate(member.joined_at || member.created_at) }}</span>
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
import { useDialog } from '../composables/useDialog';
import { useHeaderCollapse } from '../composables/useHeaderCollapse';
import ModalMember from '../components/ModalMember.vue';
import { downloadCsvFile, todayStamp } from '../composables/useCsv';

const { members, sortedMembers } = useStore();
const { alert } = useDialog();

const { isHeaderExpanded } = useHeaderCollapse('members');
const showDisabled = ref(false);
const searchQuery = ref('');
const isModalOpen = ref(false);
const selectedMember = ref(null);
const recentlyAddedIds = ref([]);

const filteredMembers = computed(() => {
  let list = sortedMembers.value;
  
  if (!showDisabled.value) {
    list = list.filter(m => m.enabled === true || m.enabled === 'TRUE' || m.enabled === 'true');
  }

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase().trim();
    list = list.filter(m => (m.name || '').toLowerCase().includes(q));
  }

  return list;
});

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return String(dateStr).split(' ')[0];
};

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

  const headers = ['이름', '이메일', '은행', '계좌번호', '상태', '가입일'];
  const rows = data.map(m => [
    m.name,
    m.email || '',
    m.bank_type || '',
    m.bank_account || '',
    m.enabled ? '활동' : '비활동',
    formatDate(m.joined_at || m.created_at)
  ]);

  downloadCsvFile(`members_${todayStamp()}.csv`, headers, rows);
};

const handleSaveMember = (formData) => {
  const isEdit = !!formData.id;
  
  if (isEdit) {
    const idx = members.value.findIndex(m => m.id === formData.id);
    if (idx !== -1) {
      const oldMember = { ...members.value[idx] };
      members.value[idx] = {
        ...members.value[idx],
        ...formData,
        joined_at: formData.joinedAt,
        bank_type: formData.bankType,
        bank_account: formData.bankAccount
      };
      
      google.script.run
        .withSuccessHandler(res => {
          if (!res || !res.success) {
            console.error('Edit failed:', res?.message);
            members.value[idx] = oldMember;
            alert({ title: '오류', message: '회원 정보 수정에 실패했습니다.', isDanger: true });
          }
        })
        .withFailureHandler(err => {
          console.error('Edit failed:', err);
          members.value[idx] = oldMember;
          alert({ title: '오류', message: '서버 요청 중 오류가 발생했습니다.', isDanger: true });
        })
        .apiUpdateMember(formData.id, {
          name: formData.name,
          email: formData.email,
          enabled: formData.enabled,
          joined_at: formData.joinedAt,
          bank_type: formData.bankType,
          bank_account: formData.bankAccount
        });
      closeModal();
    }
  } else {
    const tempId = 'temp-' + Date.now();
    const tempMember = {
      ...formData,
      id: tempId,
      joined_at: formData.joinedAt,
      bank_type: formData.bankType,
      bank_account: formData.bankAccount,
      created_at: new Date().toISOString()
    };
    members.value.unshift(tempMember);
    recentlyAddedIds.value.push(tempId);
    
    setTimeout(() => {
      recentlyAddedIds.value = recentlyAddedIds.value.filter(id => id !== tempId);
    }, 2000);
    
    google.script.run
      .withSuccessHandler(res => {
        if (res && res.success) {
          const idx = members.value.findIndex(m => m.id === tempId);
          if (idx !== -1) {
            members.value[idx] = res.data;
            
            // Transfer any active highlight from the temp ID to the server-assigned ID
            const hIdx = recentlyAddedIds.value.indexOf(tempId);
            if (hIdx > -1) {
              recentlyAddedIds.value[hIdx] = res.data.id;
              setTimeout(() => {
                recentlyAddedIds.value = recentlyAddedIds.value.filter(id => id !== res.data.id);
              }, 2000);
            }
          }
        } else {
          members.value = members.value.filter(m => m.id !== tempId);
          recentlyAddedIds.value = recentlyAddedIds.value.filter(id => id !== tempId);
          alert({ title: '오류', message: '회원 등록에 실패했습니다.', isDanger: true });
        }
      })
      .withFailureHandler(err => {
        console.error('Add failed:', err);
        members.value = members.value.filter(m => m.id !== tempId);
        recentlyAddedIds.value = recentlyAddedIds.value.filter(id => id !== tempId);
        alert({ title: '오류', message: '서버 요청 중 오류가 발생했습니다.', isDanger: true });
      })
      .apiAddMember(formData.name, formData.email, {
        joined_at: formData.joinedAt,
        bank_type: formData.bankType,
        bank_account: formData.bankAccount
      });
    closeModal();
  }
};
</script>
