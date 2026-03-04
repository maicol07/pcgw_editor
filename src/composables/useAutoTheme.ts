import { onMounted, onUnmounted } from 'vue';

export function useAutoTheme() {
    const applyTheme = () => {
        const theme = localStorage.getItem('theme') || 'system';
        const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleSystemThemeChange = () => {
        if ((localStorage.getItem('theme') || 'system') === 'system') {
            applyTheme();
        }
    };

    onMounted(() => {
        applyTheme();
        mediaQuery.addEventListener('change', handleSystemThemeChange);
        window.addEventListener('theme-changed', applyTheme);
    });

    onUnmounted(() => {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
        window.removeEventListener('theme-changed', applyTheme);
    });
}
