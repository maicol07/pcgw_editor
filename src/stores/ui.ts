import { defineStore } from 'pinia';
import { ref, reactive, watch } from 'vue';

export const useUiStore = defineStore('ui', () => {
    const isSettingsOpen = ref(false);
    const sidebarVisible = ref(false);
    const editorMode = ref<'Visual' | 'Code'>('Visual');
    const isModeSwitching = ref(false);
    const isInitialLoad = ref(true);
    type DensityMode = 'normal' | 'comfortable' | 'compact';
    const densityMode = ref<DensityMode>((localStorage.getItem('densityMode') as DensityMode) || 'normal');

    type ThemeMode = 'system' | 'light' | 'dark';
    const theme = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'system');

    const fontFamily = ref<string>(localStorage.getItem('fontFamily') || '"Google Sans"');

    // Initialize the property on load
    if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--app-font-family', fontFamily.value);
    }

    watch(densityMode, (val: DensityMode) => {
        localStorage.setItem('densityMode', val);
    });

    watch(theme, (val: ThemeMode) => {
        localStorage.setItem('theme', val);
        window.dispatchEvent(new Event('theme-changed'));
    });

    watch(fontFamily, (val: string) => {
        localStorage.setItem('fontFamily', val);
        document.documentElement.style.setProperty('--app-font-family', val);
    });

    const panelState = reactive({
        articleState: true,
        infobox: true,
        introduction: true,
        availability: true,
        monetization: true,
        dlc: true,
        essentialImprovements: true,
        gameData: true,
        video: true,
        input: true,
        audio: true,
        network: true,
        vr: true,
        other: true,
        systemReq: true,
        l10n: true,
        issues: true,
        general: true,
    });

    const panelsRendered = ref<Record<string, boolean>>({});

    const toggleSidebar = () => {
        sidebarVisible.value = !sidebarVisible.value;
    };

    const setEditorMode = (mode: 'Visual' | 'Code') => {
        editorMode.value = mode;
    };

    const expandAll = () => {
        Object.keys(panelState).forEach((k) => {
            (panelState as any)[k] = false;
        });
    };

    const collapseAll = () => {
        Object.keys(panelState).forEach((k) => {
            (panelState as any)[k] = true;
        });
    };

    return {
        sidebarVisible,
        editorMode,
        isModeSwitching,
        isInitialLoad,
        densityMode,
        fontFamily,
        theme,
        panelState,
        isSettingsOpen,
        panelsRendered,
        toggleSidebar,
        setEditorMode,
        expandAll,
        collapseAll,
    };
});
