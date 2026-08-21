import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import { pcgwAuth } from '../services/pcgwAuth';
import { aiConfig } from '../services/ai/aiConfig';

export const useUiStore = defineStore('ui', () => {
    const isSettingsOpen = ref(false);
    const settingsTab = ref('appearance');
    const openSettings = (tab: string = 'appearance') => {
        settingsTab.value = tab === 'account' ? 'publishing' : tab;
        isSettingsOpen.value = true;
    };
    const sidebarVisible = ref(false);
    const getInitialEditorMode = (): 'Visual' | 'Code' => {
        const defaultMode = localStorage.getItem('defaultEditorMode');
        if (defaultMode === 'Visual' || defaultMode === 'Code') return defaultMode;
        const stored = localStorage.getItem('editorMode');
        return (stored === 'Visual' || stored === 'Code') ? stored : 'Visual';
    };
    const editorMode = ref<'Visual' | 'Code'>(getInitialEditorMode());
    const isModeSwitching = ref(false);
    const isInitialLoad = ref(true);

    watch(editorMode, (val) => {
        localStorage.setItem('editorMode', val);
    });

    // Release notes / "what's new" dialog
    const releaseNotesOpen = ref(false);
    const buildId = `${__APP_VERSION__}@${__COMMIT_HASH__}`;
    // null = brand-new user: record the build but don't nag them with notes.
    const isNewBuild = localStorage.getItem('lastSeenBuild') !== null
        && localStorage.getItem('lastSeenBuild') !== buildId;
    const openReleaseNotes = () => { releaseNotesOpen.value = true; };
    const markBuildSeen = () => localStorage.setItem('lastSeenBuild', buildId);
    type DensityMode = 'normal' | 'comfortable' | 'compact';
    const densityMode = ref<DensityMode>((localStorage.getItem('densityMode') as DensityMode) || 'normal');

    type ThemeMode = 'system' | 'light' | 'dark';
    const theme = ref<ThemeMode>((localStorage.getItem('theme') as ThemeMode) || 'system');

    const fontFamily = ref<string>(localStorage.getItem('fontFamily') || '"Google Sans"');
    const autoUploadDescription = ref<boolean>(localStorage.getItem('autoUploadDescription') !== 'false');
    const autoReLogin = ref<boolean>(localStorage.getItem('autoReLogin') === 'true');
    const syncScroll = ref<boolean>(localStorage.getItem('syncScroll') !== 'false');
    const hideAiFeatures = ref<boolean>(localStorage.getItem('hideAiFeatures') === 'true');
    aiConfig.hideAi = hideAiFeatures.value;

    // Code Editor settings
    const editorFontSize = ref<number>(parseInt(localStorage.getItem('editorFontSize') || '14', 10));
    const editorFontFamily = ref<string>(localStorage.getItem('editorFontFamily') || 'default');
    const editorLineWrapping = ref<boolean>(localStorage.getItem('editorLineWrapping') !== 'false');
    const editorLineNumbers = ref<boolean>(localStorage.getItem('editorLineNumbers') !== 'false');
    const editorTabSize = ref<number>(parseInt(localStorage.getItem('editorTabSize') || '4', 10));
    type DefaultEditorMode = 'Visual' | 'Code' | 'remember';
    const defaultEditorMode = ref<DefaultEditorMode>((localStorage.getItem('defaultEditorMode') as DefaultEditorMode) || 'remember');

    // Live Preview settings
    const previewDebounce = ref<number>(parseInt(localStorage.getItem('previewDebounce') || '300', 10));
    type PreviewSplitRatio = '50/50' | '60/40' | '40/60' | '70/30';
    const previewSplitRatio = ref<PreviewSplitRatio>((localStorage.getItem('previewSplitRatio') as PreviewSplitRatio) || '50/50');

    // Publishing / Wiki settings
    const defaultEditSummary = ref<string>(localStorage.getItem('defaultEditSummary') || 'Updated via PCGW Editor');
    const defaultMinorEdit = ref<boolean>(localStorage.getItem('defaultMinorEdit') === 'true');
    type DefaultWatchlist = 'nochange' | 'watch' | 'unwatch' | 'preferences';
    const defaultWatchlist = ref<DefaultWatchlist>((localStorage.getItem('defaultWatchlist') as DefaultWatchlist) || 'nochange');

    // Workspace settings
    const confirmDeletions = ref<boolean>(localStorage.getItem('confirmDeletions') !== 'false');
    type DefaultSectionState = 'remember' | 'expanded' | 'collapsed';
    const defaultSectionState = ref<DefaultSectionState>((localStorage.getItem('defaultSectionState') as DefaultSectionState) || 'remember');

    const tourPart1Seen = ref<boolean>(localStorage.getItem('tour-part1-seen') === 'true');
    const tourPart2Seen = ref<boolean>(localStorage.getItem('tour-part2-seen') === 'true');
    const isTourActive = ref<boolean>(false);
    const tourStartTitle = ref<string | null>(null);

    // Initialize the property on load
    if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--app-font-family', fontFamily.value);
    }

    watch(editorFontSize, (val: number) => {
        localStorage.setItem('editorFontSize', val.toString());
    });

    watch(editorFontFamily, (val: string) => {
        localStorage.setItem('editorFontFamily', val);
    });

    watch(editorLineWrapping, (val: boolean) => {
        localStorage.setItem('editorLineWrapping', val.toString());
    });

    watch(editorLineNumbers, (val: boolean) => {
        localStorage.setItem('editorLineNumbers', val.toString());
    });

    watch(editorTabSize, (val: number) => {
        localStorage.setItem('editorTabSize', val.toString());
    });

    watch(defaultEditorMode, (val: DefaultEditorMode) => {
        localStorage.setItem('defaultEditorMode', val);
    });

    watch(previewDebounce, (val: number) => {
        localStorage.setItem('previewDebounce', val.toString());
    });

    watch(previewSplitRatio, (val: PreviewSplitRatio) => {
        localStorage.setItem('previewSplitRatio', val);
    });

    watch(defaultEditSummary, (val: string) => {
        localStorage.setItem('defaultEditSummary', val);
    });

    watch(defaultMinorEdit, (val: boolean) => {
        localStorage.setItem('defaultMinorEdit', val.toString());
    });

    watch(defaultWatchlist, (val: DefaultWatchlist) => {
        localStorage.setItem('defaultWatchlist', val);
    });

    watch(confirmDeletions, (val: boolean) => {
        localStorage.setItem('confirmDeletions', val.toString());
    });

    watch(defaultSectionState, (val: DefaultSectionState) => {
        localStorage.setItem('defaultSectionState', val);
    });

    watch(syncScroll, (val: boolean) => {
        localStorage.setItem('syncScroll', val.toString());
    });

    watch(hideAiFeatures, (val: boolean) => {
        localStorage.setItem('hideAiFeatures', val.toString());
        aiConfig.hideAi = val;
    });

    watch(autoUploadDescription, (val: boolean) => {
        localStorage.setItem('autoUploadDescription', val.toString());
    });

    watch(autoReLogin, (val: boolean) => {
        localStorage.setItem('autoReLogin', val.toString());
        pcgwAuth.onAutoReLoginChanged(val);
    });

    watch(tourPart1Seen, (val: boolean) => {
        localStorage.setItem('tour-part1-seen', val.toString());
    });

    watch(tourPart2Seen, (val: boolean) => {
        localStorage.setItem('tour-part2-seen', val.toString());
    });

    const startTour = (startTitle: string | null = null) => {
        isSettingsOpen.value = false;
        tourStartTitle.value = startTitle;
        isTourActive.value = true;
    };

    const completeTour = (completedPart?: 1 | 2) => {
        isTourActive.value = false;
        if (completedPart === 1) {
            tourPart1Seen.value = true;
        } else if (completedPart === 2) {
            tourPart1Seen.value = true;
            tourPart2Seen.value = true;
        } else {
            tourPart1Seen.value = true;
            tourPart2Seen.value = true;
        }
    };

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

    const navRailCollapsed = ref(localStorage.getItem('navRailCollapsed') === 'true');

    watch(navRailCollapsed, (val: boolean) => {
        localStorage.setItem('navRailCollapsed', val.toString());
    });

    const toggleSidebar = () => {
        sidebarVisible.value = !sidebarVisible.value;
    };

    const setEditorMode = (mode: 'Visual' | 'Code') => {
        editorMode.value = mode;
    };

    const loadStoredMap = (key: string): Record<string, boolean> => {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : {};
        } catch {
            return {};
        }
    };

    const collapsedSections = ref<Record<string, boolean>>(loadStoredMap('collapsedSections'));
    const hiddenSections = ref<Record<string, boolean>>(loadStoredMap('hiddenSections'));

    watch(collapsedSections, (val) => {
        localStorage.setItem('collapsedSections', JSON.stringify(val));
    }, { deep: true });

    watch(hiddenSections, (val) => {
        localStorage.setItem('hiddenSections', JSON.stringify(val));
    }, { deep: true });

    const toggleSectionCollapse = (key: string) => {
        collapsedSections.value = {
            ...collapsedSections.value,
            [key]: !collapsedSections.value[key]
        };
    };

    const toggleSectionHide = (key: string) => {
        hiddenSections.value = {
            ...hiddenSections.value,
            [key]: !hiddenSections.value[key]
        };
    };

    const isSectionCollapsed = (key: string): boolean => !!collapsedSections.value[key];
    const isSectionHidden = (key: string): boolean => !!hiddenSections.value[key];

    const collapseAllSections = (keys: string[]) => {
        const next: Record<string, boolean> = {};
        keys.forEach(k => { next[k] = true; });
        collapsedSections.value = next;
    };

    const expandAllSections = () => {
        collapsedSections.value = {};
    };

    const hideAllSections = (keys: string[]) => {
        const next: Record<string, boolean> = {};
        keys.forEach(k => { next[k] = true; });
        hiddenSections.value = next;
    };

    const showAllSections = () => {
        hiddenSections.value = {};
    };

    return {
        sidebarVisible,
        editorMode,
        isModeSwitching,
        isInitialLoad,
        densityMode,
        fontFamily,
        theme,
        syncScroll,
        hideAiFeatures,
        editorFontSize,
        editorFontFamily,
        editorLineWrapping,
        editorLineNumbers,
        editorTabSize,
        defaultEditorMode,
        previewDebounce,
        previewSplitRatio,
        defaultEditSummary,
        defaultMinorEdit,
        defaultWatchlist,
        confirmDeletions,
        defaultSectionState,
        autoUploadDescription,
        autoReLogin,
        navRailCollapsed,
        isSettingsOpen,
        settingsTab,
        openSettings,

        releaseNotesOpen,
        isNewBuild,
        openReleaseNotes,
        markBuildSeen,

        tourPart1Seen,
        tourPart2Seen,
        tourStartTitle,
        isTourActive,
        startTour,
        completeTour,

        collapsedSections,
        hiddenSections,
        toggleSectionCollapse,
        toggleSectionHide,
        isSectionCollapsed,
        isSectionHidden,
        collapseAllSections,
        expandAllSections,
        hideAllSections,
        showAllSections,

        toggleSidebar,
        setEditorMode,
    };
});
