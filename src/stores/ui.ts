import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useUiStore = defineStore('ui', () => {
    const isSettingsOpen = ref(false);
    const sidebarVisible = ref(false);
    const editorMode = ref<'Visual' | 'Code'>('Visual');
    const isModeSwitching = ref(false);
    const isInitialLoad = ref(true);

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
    const tourPart1Seen = ref<boolean>(localStorage.getItem('tour-part1-seen') === 'true');
    const tourPart2Seen = ref<boolean>(localStorage.getItem('tour-part2-seen') === 'true');
    const isTourActive = ref<boolean>(false);
    const tourStartTitle = ref<string | null>(null);

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
        navRailCollapsed,
        isSettingsOpen,

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

        toggleSidebar,
        setEditorMode,
    };
});
