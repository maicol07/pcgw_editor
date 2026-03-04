import { describe, it, expect, vi } from 'vitest';
import { usePlatform } from '../../../src/composables/usePlatform';

describe('usePlatform', () => {
    it('returns ⌘K on macOS', () => {
        // Mock navigator
        const originalPlatform = navigator.platform;
        Object.defineProperty(navigator, 'platform', {
            value: 'MacIntel',
            configurable: true
        });

        const { shortcutLabel, isMac } = usePlatform();
        expect(isMac.value).toBe(true);
        expect(shortcutLabel.value).toBe('⌘K');

        // Reset
        Object.defineProperty(navigator, 'platform', {
            value: originalPlatform,
            configurable: true
        });
    });

    it('returns Ctrl+K on other platforms', () => {
        // Mock navigator
        const originalPlatform = navigator.platform;
        Object.defineProperty(navigator, 'platform', {
            value: 'Win32',
            configurable: true
        });

        const { shortcutLabel, isMac } = usePlatform();
        expect(isMac.value).toBe(false);
        expect(shortcutLabel.value).toBe('Ctrl+K');

        // Reset
        Object.defineProperty(navigator, 'platform', {
            value: originalPlatform,
            configurable: true
        });
    });
});
