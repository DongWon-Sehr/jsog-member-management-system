<script setup>
import { ref, onMounted, watch } from "vue"
import IMask from "imask"

const model = defineModel() // v-model
const inputRef = ref(null)
let mask

onMounted(() => {
  mask = IMask(inputRef.value, {
    mask: "HH:MM",
    blocks: {
      HH: { 
        mask: IMask.MaskedRange, 
        from: 0, 
        to: 23, 
        maxLength: 2,
        placeholderChar: '0'
      },
      MM: { 
        mask: IMask.MaskedRange, 
        from: 0, 
        to: 59, 
        maxLength: 2,
        placeholderChar: '0'
      }
    },
    lazy: false // Always show mask
  })

  // Sync mask to model
  mask.on("accept", () => {
    model.value = mask.value
  })

  // Initial sync from model
  if (model.value) {
    mask.value = model.value
  }
})

// Keep mask in sync if model changes from outside
watch(() => model.value, (newVal) => {
  if (mask && newVal !== mask.value) {
    mask.value = newVal || ""
  }
})

function selectHours() {
  inputRef.value.setSelectionRange(0, 2)
}

function selectMinutes() {
  inputRef.value.setSelectionRange(3, 5)
}

function handleInput(e) {
  const pos = inputRef.value.selectionStart

  // If HH (first 2 chars) is filled, move to MM
  if (pos === 2) {
    setTimeout(selectMinutes, 0)
  }
}

function handleDblClick() {
  const pos = inputRef.value.selectionStart
  if (pos <= 2) {
    selectHours()
  } else {
    selectMinutes()
  }
}
</script>

<template>
  <input
    ref="inputRef"
    class="custom-time-input"
    placeholder="HH:mm"
    @input="handleInput"
    @dblclick="handleDblClick"
  />
</template>

<style scoped>
.custom-time-input {
  width: 100%;
  height: 38px;
  background-color: white;
  border: 1px solid #e5e7eb; /* border-gray-200 */
  border-radius: 0.75rem; /* rounded-xl */
  padding: 0.5rem 0.75rem; /* px-3 py-2 */
  font-size: 0.875rem; /* text-sm */
  font-weight: 700; /* font-bold */
  color: #111827; /* text-gray-900 */
  outline: none;
  transition: all 0.2s ease;
  text-align: center;
  box-sizing: border-box; /* Crucial for grid layout */
}

.custom-time-input:focus {
  border-color: #6366f1; /* border-indigo-500 */
  box-shadow: 0 0 0 1px #6366f1;
}

/* Specific styling for the mini version in the list */
.custom-time-input.custom-time-input-mini {
  background-color: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0.125rem !important;
  font-size: 11px !important;
  height: auto !important;
  color: #374151 !important; /* text-gray-700 */
}

.custom-time-input.custom-time-input-mini:focus {
  background-color: #f5f3ff !important; /* bg-indigo-50 */
  border-radius: 4px !important;
}
</style>
