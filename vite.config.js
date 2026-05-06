import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    vue(),
    viteSingleFile(),
    viteStaticCopy({
      targets: [
        {
          src: 'src/appsscript.json',
          dest: ''
        },
        {
          src: 'src/Code.js',
          dest: ''
        }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
