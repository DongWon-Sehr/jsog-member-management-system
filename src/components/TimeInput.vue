<script setup>
import { ref, onMounted, watch, useAttrs } from "vue"
// IMask is now global from CDN

const props = defineProps({
  variant: {
    type: String,
    default: 'normal'
  }
})

const model = defineModel() // v-model
const attrs = useAttrs()
const inputRef = ref(null)
let mask

onMounted(() => {
  // Use global IMask
  const IMaskLib = window.IMask;
  
  if (!IMaskLib) {
    console.error('[TimeInput] IMask library not found in window object');
    return;
  }

  mask = IMaskLib(inputRef.value, {
    mask: "HH:MM",
    blocks: {
      HH: { 
        mask: IMaskLib.MaskedRange, 
        from: 0, 
        to: 23, 
        maxLength: 2,
        placeholderChar: '0'
      },
      MM: { 
        mask: IMaskLib.MaskedRange, 
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
    if (model.value !== mask.value) {
      model.value = mask.value
    }
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

function handleInput(e) {
  const pos = inputRef.value.selectionStart
  if (pos === 2) {
    setTimeout(() => {
      inputRef.value.setSelectionRange(3, 5);
    }, 0)
  }
}

function handleDblClick() {
  const pos = inputRef.value.selectionStart
  if (pos <= 2) {
    inputRef.value.setSelectionRange(0, 2);
  } else {
    inputRef.value.setSelectionRange(3, 5);
  }
}
</script>

<template>
  <input
    ref="inputRef"
    :class="[
      'outline-none transition-all box-border text-left',
      variant === 'responsive-mini'
        ? 'w-full bg-gray-50 sm:bg-transparent border border-gray-200 sm:border-none text-xs sm:text-[11px] font-bold text-gray-900 p-2 sm:p-0.5 rounded-xl sm:rounded focus:ring-1 focus:ring-indigo-200'
        : (variant === 'mini' || (attrs.class && attrs.class.includes('custom-time-input-mini')))
          ? 'w-full bg-transparent border-none text-[11px] font-bold text-gray-900 p-0.5 rounded focus:ring-1 focus:ring-indigo-200' 
          : 'w-full h-[38px] bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:border-indigo-500'
    ]"
    placeholder="HH:mm"
    @input="handleInput"
    @dblclick="handleDblClick"
  />
</template>

<style scoped>
/* 
  IMPORTANT: Styles here are discarded by post-build.js. 
  All styling MUST be done via Tailwind classes in the template.
*/
</style>
