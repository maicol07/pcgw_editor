import { computed } from 'vue';

export function usePlatform() {
    const isMac = computed(() => {
        if (typeof window === 'undefined') return false;
        // navigator.platform is deprecated but still the most reliable for this specific check
        // navigator.userAgentData is a modern alternative but not fully supported
        return navigator.platform.toUpperCase().indexOf('MAC') >= 0 ||
            navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
    });

    const shortcutLabel = computed(() => isMac.value ? '⌘K' : 'Ctrl+K');

    return {
        isMac,
        shortcutLabel
    };
}
