import { readFileSync } from 'fs';
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import externalGlobals from "rollup-plugin-external-globals";

// Single source of truth for the version shown in the header, so it cannot drift from package.json
const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version)
  },
  plugins: [
    vue(),
    viteStaticCopy({
      targets: [
        { src: 'appsscript.json', dest: '' },
        { src: 'src/backend/**/*.js', dest: '' }
      ]
    })
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    rollupOptions: {
      external: ["vue", "imask"],
      plugins: [
        externalGlobals({
          vue: "Vue",
          imask: "IMask"
        }),
      ],
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name].[ext]`
      }
    }
  }
});
