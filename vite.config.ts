import { defineConfig } from 'vite';

export default defineConfig(({mode}) => ({
 base: mode === 'pages' ? '/Year1/' : '/',
 build: {
  outDir: mode === 'pages' ? 'dist-pages' : 'dist',
  rollupOptions: {output: {manualChunks: {three: ['three', 'three/addons/controls/OrbitControls.js']}}}
 }
}));
