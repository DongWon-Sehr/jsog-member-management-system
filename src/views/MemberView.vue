<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h2 class="text-xl sm:text-2xl font-bold text-gray-800">회원 관리</h2>
      <button @click="openAddModal" class="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md active:scale-95">
        <i class="ph-bold ph-plus text-base sm:text-lg"></i>
        <span class="text-sm sm:text-base font-semibold">등록</span>
      </button>
    </div>

    <!-- Member Table / Mobile List View -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <!-- Desktop Table (Hidden on small screens) -->
      <div class="hidden md:block overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">이름</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">이메일</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">상태</th>
              <th class="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">가입일</th>
              <th class="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">관리</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr v-for="member in members" :key="member.id" class="hover:bg-indigo-50/30 transition-colors group">
              <td class="px-6 py-4 whitespace-nowrap">
                <div class="font-bold text-gray-900">{{ member.name }}</div>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-gray-500 text-sm">
                {{ member.email || '-' }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap">
                <span 
                  class="px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                  :class="member.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'"
                >
                  {{ member.enabled ? 'Active' : 'Disabled' }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-400 font-mono">
                {{ formatDate(member.created_at) }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button @click="openEditModal(member)" class="p-1.5 hover:bg-white rounded-lg text-indigo-600 shadow-sm border border-transparent hover:border-indigo-100">
                    <i class="ph-bold ph-pencil-simple"></i>
                  </button>
                  <button @click="toggleStatus(member)" class="p-1.5 hover:bg-white rounded-lg shadow-sm border border-transparent"
                    :class="member.enabled ? 'text-red-500 hover:border-red-100' : 'text-emerald-500 hover:border-emerald-100'">
                    <i class="ph-bold" :class="member.enabled ? 'ph-user-minus' : 'ph-user-plus'"></i>
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile List View (Visible on small screens) -->
      <div class="md:hidden divide-y divide-gray-100">
        <div v-for="member in members" :key="member.id" class="p-4 flex items-center justify-between hover:bg-gray-50">
          <div class="flex items-center gap-3">
            <div class="h-10 w-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold">
              {{ member.name.charAt(0) }}
            </div>
            <div>
              <div class="font-bold text-gray-900">{{ member.name }}</div>
              <div class="text-xs text-gray-400">{{ member.email || 'No email' }}</div>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-[10px] font-black uppercase px-2 py-0.5 rounded-md"
              :class="member.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'">
              {{ member.enabled ? 'On' : 'Off' }}
            </span>
            <button @click="toggleStatus(member)" class="p-2 rounded-lg bg-gray-50 active:bg-gray-100">
              <i class="ph-bold" :class="member.enabled ? 'ph-user-minus text-red-500' : 'ph-user-plus text-emerald-500'"></i>
            </button>
          </div>
        </div>
      </div>

      <div v-if="members.length === 0" class="px-6 py-12 text-center text-gray-400 italic bg-gray-50/50">
        등록된 회원이 없습니다.
      </div>
    </div>
  </div>
</template>

<script setup>
import { useStore } from '../composables/useStore';
import { useGas } from '../composables/useGas';

const { members } = useStore();
const { call } = useGas();

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  return String(dateStr).split(' ')[0];
};

const openAddModal = () => alert('회원 등록 준비 중');
const openEditModal = (m) => alert(`${m.name} 정보 수정 준비 중`);

const toggleStatus = (member) => {
  const isCurrentlyEnabled = member.enabled;
  const action = isCurrentlyEnabled ? 'apiDeactivateMember' : 'apiReactivateMember';
  
  // Optimistic UI Update
  member.enabled = !isCurrentlyEnabled;

  google.script.run
    .withFailureHandler((err) => {
      console.error(`Failed to toggle member status:`, err);
      // Rollback
      member.enabled = isCurrentlyEnabled;
    })
    [action](member.id);
};
</script>
