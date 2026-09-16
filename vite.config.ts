import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tanstackRouter({ target: 'react', autoCodeSplitting: true }), react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
  },
  test: {
    globals: true,
    // 컴포넌트 테스트가 DOM 을 필요로 한다. 계산 로직 테스트도 같은 환경에서 잘 돈다
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    // .test.tsx 를 빠뜨리면 컴포넌트 테스트가 CI 에서 조용히 건너뛰어진다.
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
