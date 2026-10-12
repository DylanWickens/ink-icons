import { defineConfig } from 'vite';

export default defineConfig({
  resolve: {
    // Addons import bare 'three'; point it at the WebGPU build so only one copy of three is bundled.
    alias: [{ find: /^three$/, replacement: 'three/webgpu' }],
  },
});
