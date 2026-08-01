import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import path from 'path';

export default defineConfig({
    plugins: [vue()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
        },
    },
    test: {
        // jsdom, not happy-dom: under happy-dom DOMPurify silently drops the first top-level
        // element, so every sanitization assertion passed vacuously and the XSS-hardening
        // tests could not be written at all. Verified against a real browser.
        environment: 'jsdom',
        globals: true,
        include: ['tests/**/*.test.ts'],
        setupFiles: ['./tests/setup.ts'],
        server: {
            deps: {
                inline: ['element-plus']
            }
        }
    },
});
