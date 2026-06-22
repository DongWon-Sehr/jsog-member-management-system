import { ref } from 'vue';

const isOpen = ref(false);
const dialogType = ref('alert'); // 'alert' or 'confirm'
const title = ref('');
const message = ref('');
const confirmText = ref('확인');
const cancelText = ref('닫기');
const isDanger = ref(false);

let resolvePromise = null;

export function useDialog() {
  const openDialog = (options) => {
    title.value = options.title || '알림';
    message.value = options.message || '';
    dialogType.value = options.type || 'alert';
    confirmText.value = options.confirmText || '확인';
    cancelText.value = options.cancelText || '닫기';
    isDanger.value = options.isDanger || false;
    isOpen.value = true;

    return new Promise((resolve) => {
      resolvePromise = resolve;
    });
  };

  const alert = (options) => {
    let opts = typeof options === 'string' ? { message: options } : options;
    return openDialog({ ...opts, type: 'alert' });
  };

  const confirm = (options) => {
    let opts = typeof options === 'string' ? { message: options } : options;
    return openDialog({ ...opts, type: 'confirm' });
  };

  const handleConfirm = () => {
    isOpen.value = false;
    if (resolvePromise) resolvePromise(true);
  };

  const handleCancel = () => {
    isOpen.value = false;
    if (resolvePromise) resolvePromise(false);
  };

  return {
    isOpen,
    dialogType,
    title,
    message,
    confirmText,
    cancelText,
    isDanger,
    alert,
    confirm,
    handleConfirm,
    handleCancel
  };
}
