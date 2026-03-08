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
    const autoUploadDescription = ref<boolean>(localStorage.getItem('autoUploadDescription') !== 'false');
    const autoReLogin = ref<boolean>(localStorage.getItem('autoReLogin') === 'true');

    // Initialize the property on load
    if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--app-font-family', fontFamily.value);
    }

    watch(autoUploadDescription, (val: boolean) => {
        localStorage.setItem('autoUploadDescription', val.toString());
    });

    watch(autoReLogin, (val: boolean) => {
        localStorage.setItem('autoReLogin', val.toString());
    });

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
        autoUploadDescription,
        autoReLogin,
        panelState,
        isSettingsOpen,

        toggleSidebar,
        setEditorMode,
        expandAll,
        collapseAll,
    };
});
