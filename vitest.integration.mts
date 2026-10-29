import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
    // 集成测试串行执行：共享同一个 PostgreSQL 模式
    fileParallelism: false,
    sequence: { concurrent: false },
  },
})
