import { vi } from 'vitest';
import { config } from '@vue/test-utils';
import PrimeVue from 'primevue/config';
import Aura from '@primevue/themes/aura';
import Tooltip from 'primevue/tooltip';

// Mock localStorage if it's broken in the environment
if (typeof window !== 'undefined') {
    if (!window.localStorage || typeof window.localStorage.getItem !== 'function') {
        const storage: Record<string, string> = {};
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn((key: string) => storage[key] || null),
                setItem: vi.fn((key: string, value: string) => { storage[key] = value; }),
                removeItem: vi.fn((key: string) => { delete storage[key]; }),
                clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]); }),
                length: 0,
                key: vi.fn((index: number) => Object.keys(storage)[index] || null),
            },
            configurable: true,
            enumerable: true,
            writable: true
        });
    }
}

// Global Vue Test Utils configuration
config.global.plugins = [[PrimeVue, { theme: { preset: Aura } }]];
config.global.directives = {
    tooltip: Tooltip
};
