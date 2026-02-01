import { onMounted, onUnmounted } from 'vue';

export function useAutoTheme() {
    const applyTheme = (isDark: boolean) => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
        applyTheme(e.matches);
    };

    onMounted(() => {
        // Apply initial theme
        applyTheme(mediaQuery.matches);

        // Listen for changes
        mediaQuery.addEventListener('change', handleThemeChange);
    });

    onUnmounted(() => {
        mediaQuery.removeEventListener('change', handleThemeChange);
    });
}
