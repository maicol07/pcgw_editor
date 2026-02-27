import { defineStore } from 'pinia';
import { ref, reactive, watch } from 'vue';

export const useUiStore = defineStore('ui', () => {
    const sidebarVisible = ref(false);
    const editorMode = ref<'Visual' | 'Code'>('Visual');
    const isModeSwitching = ref(false);
    const isInitialLoad = ref(true);
    type DensityMode = 'normal' | 'comfortable' | 'compact';
    const densityMode = ref<DensityMode>((localStorage.getItem('densityMode') as DensityMode) || 'normal');

    watch(densityMode, (val: DensityMode) => {
        localStorage.setItem('densityMode', val);
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
        panelState,
        panelsRendered,
        toggleSidebar,
        setEditorMode,
        expandAll,
        collapseAll,
    };
});
