// vitest.config.ts
import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    root: './',
    include: ['src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'test/**/*.e2e-spec.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
    },
  },
  plugins: [
    swc.vite({
      // Necessário para que os decorators e metadata do NestJS funcionem
      module: { type: 'es6' },
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        transform: {
          legacyDecorator: true,
          decoratorMetadata: true,
        },
        target: 'es2022',
      },
    }),
  ],
});
