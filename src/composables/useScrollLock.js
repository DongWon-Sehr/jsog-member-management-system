import { watch, onUnmounted, isRef } from 'vue';

export function useScrollLock(isOpenProp) {
  let scrollPosition = 0;
  let isLocked = false;

  const lockScroll = () => {
    if (isLocked) return;
    scrollPosition = window.scrollY || document.documentElement.scrollTop;
    console.log('[useScrollLock] Locking scroll at', scrollPosition);
    document.body.style.setProperty('overflow', 'hidden', 'important');
    document.body.style.setProperty('position', 'fixed', 'important');
    document.body.style.setProperty('top', `-${scrollPosition}px`, 'important');
    document.body.style.setProperty('width', '100%', 'important');
    isLocked = true;
  };

  const unlockScroll = () => {
    if (!isLocked) return;
    console.log('[useScrollLock] Unlocking scroll, restoring to', scrollPosition);
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('top');
    document.body.style.removeProperty('width');
    window.scrollTo(0, scrollPosition);
    isLocked = false;
  };

  watch(
    () => (isRef(isOpenProp) ? isOpenProp.value : isOpenProp),
    (newVal) => {
      console.log('[useScrollLock] Watcher triggered, newVal:', newVal);
      if (newVal) lockScroll();
      else unlockScroll();
    },
    { immediate: true }
  );

  onUnmounted(() => {
    unlockScroll();
  });
}
