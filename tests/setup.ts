import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Suppress experimental localStorage warnings from Node.js
const originalEmit = process.emit;
process.emit = function (this: any, name: string, ...args: any[]) {
    if (name === 'warning' && args[0]?.name === 'ExperimentalWarning' && args[0]?.message?.includes('localStorage')) {
        return false;
    }
    return originalEmit.apply(this, [name, ...args] as any);
} as any;

// Mock Dexie globally to avoid IndexedDB missing API errors in test environment
vi.mock('dexie', () => {
    return {
        default: class MockDexie {
            _tables: Record<string, Map<any, any>> = {};

            _getTable(name: string) {
                if (!this._tables[name]) {
                    this._tables[name] = new Map();
                }
                return this._tables[name];
            }

            constructor() {
                return new Proxy(this, {
                    get(target, prop) {
                        if (typeof prop === 'string' && prop in target && (target as any)[prop] !== undefined) {
                            return (target as any)[prop];
                        }
                        if (typeof prop === 'symbol' || prop === 'then') return undefined;

                        const table = (target as any)._getTable(prop);
                        const serializeKey = (k: any) => Array.isArray(k) ? JSON.stringify(k) : k;
                        return {
                            toArray: vi.fn().mockImplementation(async () => Array.from(table.values())),
                            add: vi.fn().mockImplementation(async (item: any) => {
                                const id = item.pageId && item.section 
                                    ? serializeKey([item.pageId, item.section]) 
                                    : (item.id ?? item.key ?? item.pageId ?? table.size + 1);
                                table.set(id, item);
                                return id;
                            }),
                            delete: vi.fn().mockImplementation(async (key: any) => {
                                table.delete(serializeKey(key));
                            }),
                            update: vi.fn().mockImplementation(async (key: any, updates: any) => {
                                const sKey = serializeKey(key);
                                const existing = table.get(sKey) || {};
                                table.set(sKey, { ...existing, ...updates });
                            }),
                            put: vi.fn().mockImplementation(async (item: any) => {
                                const key = item.pageId && item.section
                                    ? serializeKey([item.pageId, item.section])
                                    : (item.pageId ?? item.key ?? item.id ?? item.revid ?? 'default');
                                table.set(key, item);
                                return key;
                            }),
                            get: vi.fn().mockImplementation(async (key: any) => table.get(serializeKey(key)) ?? undefined),
                            count: vi.fn().mockImplementation(async () => table.size),
                            orderBy: vi.fn().mockReturnValue({
                                limit: vi.fn().mockReturnValue({
                                    primaryKeys: vi.fn().mockResolvedValue([])
                                })
                            }),
                            bulkDelete: vi.fn().mockResolvedValue(undefined),
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
import PrimeVue from 'openvue/config';
import Aura from '@openvue/themes/aura';
import Tooltip from 'openvue/tooltip';

// jsdom implements no matchMedia; PrimeVue/openvue components call it on mount.
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
    Object.defineProperty(window, 'matchMedia', {
        value: (query: string) => ({
            matches: false,
            media: query,
            onchange: null,
            addEventListener: vi.fn(),
            removeEventListener: vi.fn(),
            addListener: vi.fn(),    // deprecated, still used by some libs
            removeListener: vi.fn(),
            dispatchEvent: vi.fn(),
        }),
        configurable: true,
        writable: true,
    });
}

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
