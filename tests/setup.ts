import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Suppress experimental localStorage warnings from Node.js
const originalEmit = process.emit;
process.emit = function (name: string, ...args: any[]) {
    if (name === 'warning' && args[0]?.name === 'ExperimentalWarning' && args[0]?.message?.includes('localStorage')) {
        return false;
    }
    return originalEmit.apply(this, [name, ...args] as any);
} as any;

// Mock Dexie globally to avoid IndexedDB missing API errors in test environment
vi.mock('dexie', () => {
    return {
        default: class MockDexie {
            constructor() {
                return new Proxy(this, {
                    get(target, prop) {
                        if (prop in target && (target as any)[prop] !== undefined) {
                            return (target as any)[prop];
                        }
                        // Return mock table methods for any table property access
                        return {
                            toArray: vi.fn().mockResolvedValue([]),
                            add: vi.fn().mockResolvedValue(1),
                            delete: vi.fn().mockResolvedValue(undefined),
                            update: vi.fn().mockResolvedValue(undefined),
                            put: vi.fn().mockResolvedValue(1),
                            get: vi.fn().mockResolvedValue(undefined),
                        };
                    }
                });
            }
            version() {
                return {
                    stores: () => this
                };
            }
        }
    };
});

// Define global constants that are injected by Vite
(globalThis as any).__APP_VERSION__ = 'test-version';
(globalThis as any).__COMMIT_HASH__ = 'test-hash';
import PrimeVue from 'primevue/config';
import Aura from '@primeuix/themes/aura';
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
