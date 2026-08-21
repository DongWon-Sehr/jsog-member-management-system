import { ref } from 'vue';

// Mobile-only feature (md+ always shows the header). Module-level so the choice
// survives tab switches (views remount); app entry starts collapsed
const states = new Map();

export function useHeaderCollapse(viewKey) {
  if (!states.has(viewKey)) states.set(viewKey, ref(false));
  return { isHeaderExpanded: states.get(viewKey) };
}
