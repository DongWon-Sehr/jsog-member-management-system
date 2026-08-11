import { ref } from 'vue';

// ESM import required: snapdom's classic build leaks globals that this bundle's mangler clobbers
let snapdomPromise = null;
const loadSnapdom = () => {
  snapdomPromise ||= import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@zumer/snapdom@2.24.1/dist/snapdom.mjs').then(m => m.snapdom);
  return snapdomPromise;
};

/**
 * Captures a DOM element as a PNG and triggers a download
 */
export function useScreenshot() {
  const isCapturing = ref(false);

  const SCALE = 2;
  const PAGE_BG = '#f9fafb';
  const SEGMENT_GAP = 24;

  /**
   * Captures each element and stitches them vertically into one PNG
   * @param {Array<{id: string, bg?: string}>} segments - elements top to bottom
   * @param {string} filename - download filename (.png)
   */
  const captureElement = async (segments, filename) => {
    const targets = segments
      .map(s => ({ ...s, element: document.getElementById(s.id) }))
      .filter(s => s.element);
    if (targets.length === 0 || isCapturing.value) return;
    // At fractional browser zoom the SVG clone rasterizes text wider and re-wraps lines
    const noWrapLock = document.createElement('style');
    noWrapLock.textContent = '.capturing, .capturing * { flex-wrap: nowrap !important; white-space: nowrap !important; }';
    document.head.appendChild(noWrapLock);
    targets.forEach(t => t.element.classList.add('capturing'));
    isCapturing.value = true;
    try {
      const snapdom = await loadSnapdom();
      const canvases = [];
      for (const t of targets) {
        const result = await snapdom(t.element, { backgroundColor: t.bg || PAGE_BG, scale: SCALE, embedFonts: true, iconFonts: [/phosphor/i] });
        canvases.push(await result.toCanvas());
      }
      const gap = SEGMENT_GAP * SCALE;
      const width = Math.max(...canvases.map(c => c.width));
      const height = canvases.reduce((sum, c) => sum + c.height, 0) + gap * (canvases.length - 1);
      const out = document.createElement('canvas');
      out.width = width;
      out.height = height;
      const ctx = out.getContext('2d');
      ctx.fillStyle = PAGE_BG;
      ctx.fillRect(0, 0, width, height);
      let y = 0;
      for (const c of canvases) {
        ctx.drawImage(c, Math.round((width - c.width) / 2), y);
        y += c.height + gap;
      }
      const link = document.createElement('a');
      link.href = out.toDataURL('image/png');
      link.download = filename;
      link.click();
    } catch (err) { console.error('Screenshot failed:', err); }
    finally {
      targets.forEach(t => t.element.classList.remove('capturing'));
      noWrapLock.remove();
      isCapturing.value = false;
    }
  };

  return { captureElement, isCapturing };
}
