<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
import { useUiStore } from '../../stores/ui';
import { useWorkspaceStore } from '../../stores/workspace';
import Button from 'primevue/button';
import { X, ChevronLeft, ChevronRight, Play } from 'lucide-vue-next';

const uiStore = useUiStore();
const workspaceStore = useWorkspaceStore();

interface TourStep {
    title: string;
    text: string;
    target?: string;
    placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
    action?: () => void | Promise<void>;
    conditional?: () => boolean;
}

const allSteps: TourStep[] = [
    {
        title: 'Welcome to PCGamingWiki Editor! 🎮',
        text: 'This editor helps you easily contribute to PCGamingWiki with a powerful visual interface. Let\'s take a 1-minute interactive tour to show you around.',
        placement: 'center'
    },
    {
        title: 'Workspace Sidebar 📂',
        text: 'The Workspace panel contains your offline workspace pages. Here you can search, filter, and organize pages you are currently editing.',
        target: '[data-tour="workspace-sidebar"]',
        placement: 'right',
        action: () => {
            uiStore.sidebarVisible = true;
        }
    },
    {
        title: 'Create or Import Pages ➕',
        text: 'Create a new page using templates (Singleplayer, Multiplayer, Blank), or import an existing page directly from PCGamingWiki using its URL or search.',
        target: '[data-tour="new-page-btn"]',
        placement: 'right',
        action: () => {
            uiStore.sidebarVisible = true;
        }
    },
    {
        title: 'Editor Toolbar 🛠️',
        text: 'Manage page settings, check if a newer revision was published online, pull latest edits, or publish your changes back to PCGamingWiki.',
        target: '[data-tour="editor-toolbar"]',
        placement: 'bottom',
        action: () => {
            uiStore.sidebarVisible = false;
        },
        conditional: () => !!workspaceStore.activePage
    },
    {
        title: 'AI Smart Assistant 🧙‍♂️',
        text: 'Generate automatic summaries of your changes using Gemini, Claude, or OpenAI. Perfect for filling out wiki edit summaries before publishing.',
        target: '[data-tour="ai-summary"]',
        placement: 'bottom',
        action: () => {
            uiStore.sidebarVisible = false;
        },
        conditional: () => !!workspaceStore.activePage
    },
    {
        title: 'Visual / Code Modes 🔄',
        text: 'Switch between Visual Mode (form-based editing with schemas) and Code Mode (direct wikitext source editing with syntax highlighting).',
        target: '[data-tour="editor-mode"]',
        placement: 'bottom',
        action: () => {
            uiStore.sidebarVisible = false;
        },
        conditional: () => !!workspaceStore.activePage
    },
    {
        title: 'Section Navigation 🗺️',
        text: 'In Visual Mode, use this vertical navigation rail to instantly jump between page sections (e.g. Infobox, Availability, System Requirements).',
        target: '[data-tour="section-nav"]',
        placement: 'right',
        action: async () => {
            uiStore.sidebarVisible = false;
            if (uiStore.editorMode !== 'Visual') {
                uiStore.setEditorMode('Visual');
            }
        },
        conditional: () => !!workspaceStore.activePage && uiStore.editorMode === 'Visual'
    },
    {
        title: 'Visual Forms 📝',
        text: 'Fill out structured inputs, checkboxes, and lists. The schemas align directly with PCGamingWiki\'s template rules, preventing formatting errors.',
        target: '[data-tour="editor-sections"]',
        placement: 'top',
        action: () => {
            uiStore.sidebarVisible = false;
        },
        conditional: () => !!workspaceStore.activePage
    },
    {
        title: 'Live Preview 👁️',
        text: 'Watch your changes compile and render in real-time on the right. You can inspect exactly how the page will look live on PCGamingWiki.',
        target: '[data-tour="preview-panel"]',
        placement: 'left',
        action: () => {
            uiStore.sidebarVisible = false;
        },
        conditional: () => !!workspaceStore.activePage
    },
    {
        title: 'App Settings ⚙️',
        text: 'Customize the editor\'s theme, typography, layout density, and enter credentials for Twitch, RAWG, and Gemini APIs to enable smart autocomplete assistance.',
        target: '[data-tour="settings-btn"]',
        placement: 'left',
        action: () => {
            uiStore.sidebarVisible = false;
        }
    },
    {
        title: 'You\'re All Set! 🎉',
        text: 'You are ready to start editing. If you ever need to view this tour again, you can relaunch it from the App Settings under the Appearance tab.',
        placement: 'center'
    }
];

const currentStepIndex = ref(0);
const cardRef = ref<HTMLElement | null>(null);

const activeSteps = computed(() => {
    return allSteps.filter(step => {
        if (step.conditional) {
            return step.conditional();
        }
        return true;
    });
});

const currentStep = computed(() => activeSteps.value[currentStepIndex.value]);

const cardStyle = ref<Record<string, string>>({
    position: 'fixed',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    opacity: '0'
});

const highlightStyle = ref<Record<string, string>>({
    top: '0px',
    left: '0px',
    width: '0px',
    height: '0px',
    opacity: '0',
    pointerEvents: 'none'
});

const updatePosition = () => {
    if (!uiStore.isTourActive) return;
    const step = currentStep.value;
    if (!step) return;

    if (!step.target || step.placement === 'center') {
        cardStyle.value = {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: '1'
        };
        highlightStyle.value = {
            top: '0px',
            left: '0px',
            width: '0px',
            height: '0px',
            opacity: '0',
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        };
        return;
    }

    const el = document.querySelector(step.target);
    if (!el) {
        // Fallback to center if element is not in DOM
        cardStyle.value = {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            opacity: '1'
        };
        highlightStyle.value = {
            top: '0px',
            left: '0px',
            width: '0px',
            height: '0px',
            opacity: '0',
            pointerEvents: 'none',
            transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        };
        return;
    }

    const rect = el.getBoundingClientRect();
    const padding = 8;
    highlightStyle.value = {
        top: `${rect.top - padding}px`,
        left: `${rect.left - padding}px`,
        width: `${rect.width + padding * 2}px`,
        height: `${rect.height + padding * 2}px`,
        opacity: '1',
        pointerEvents: 'auto',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
    };

    const cardEl = cardRef.value;
    const cardWidth = cardEl ? cardEl.offsetWidth : 350;
    const cardHeight = cardEl ? cardEl.offsetHeight : 190;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let top = 0;
    let left = 0;
    const gap = 16;

    const placement = step.placement || 'bottom';

    if (placement === 'bottom') {
        top = rect.bottom + gap;
        left = rect.left + rect.width / 2 - cardWidth / 2;
    } else if (placement === 'top') {
        top = rect.top - cardHeight - gap;
        left = rect.left + rect.width / 2 - cardWidth / 2;
    } else if (placement === 'left') {
        top = rect.top + rect.height / 2 - cardHeight / 2;
        left = rect.left - cardWidth - gap;
    } else if (placement === 'right') {
        top = rect.top + rect.height / 2 - cardHeight / 2;
        left = rect.right + gap;
    }

    // Boundary constraints
    if (left < 16) left = 16;
    if (left + cardWidth > viewportWidth - 16) {
        left = viewportWidth - cardWidth - 16;
    }
    if (top < 16) top = 16;
    if (top + cardHeight > viewportHeight - 16) {
        top = viewportHeight - cardHeight - 16;
    }

    cardStyle.value = {
        position: 'fixed',
        top: `${top}px`,
        left: `${left}px`,
        transform: 'none',
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: '1'
    };
};

const goToStep = async (index: number) => {
    if (index < 0 || index >= activeSteps.value.length) return;
    currentStepIndex.value = index;
    const step = activeSteps.value[index];
    
    if (step && step.action) {
        await step.action();
        // Allow reactive drawer slide animations to begin/complete
        await nextTick();
        setTimeout(updatePosition, 100);
        setTimeout(updatePosition, 300);
    } else {
        await nextTick();
        updatePosition();
    }
};

const handleNext = () => {
    if (currentStepIndex.value < activeSteps.value.length - 1) {
        goToStep(currentStepIndex.value + 1);
    } else {
        handleClose();
    }
};

const handleBack = () => {
    if (currentStepIndex.value > 0) {
        goToStep(currentStepIndex.value - 1);
    }
};

const handleClose = () => {
    if (!workspaceStore.activePage) {
        uiStore.completeTour(1);
    } else {
        uiStore.completeTour(2);
    }
};

watch(() => uiStore.isTourActive, (active) => {
    if (active) {
        let startIndex = 0;
        if (uiStore.tourStartTitle) {
            const index = activeSteps.value.findIndex(s =>
                s.title.toLowerCase().includes(uiStore.tourStartTitle!.toLowerCase())
            );
            if (index !== -1) {
                startIndex = index;
            }
        }
        currentStepIndex.value = startIndex;
        nextTick(() => {
            goToStep(startIndex);
        });
    }
});

// Watch reactive properties that might affect DOM layout and layout positioning
watch([() => uiStore.sidebarVisible, () => uiStore.editorMode], () => {
    if (uiStore.isTourActive) {
        nextTick(() => {
            setTimeout(updatePosition, 150);
        });
    }
});

onMounted(() => {
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    if (uiStore.isTourActive) {
        goToStep(0);
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', updatePosition);
    window.removeEventListener('scroll', updatePosition, true);
});
</script>

<template>
    <Transition name="fade">
        <div v-if="uiStore.isTourActive" class="tour-container select-none">
            <!-- Semi-transparent overlay block -->
            <div class="fixed inset-0 z-[9998] bg-black/55 pointer-events-auto" @click="handleClose"></div>

            <!-- Focused element cutout overlay -->
            <div class="fixed border-2 border-primary-500 dark:border-primary-400 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] z-[9998] pointer-events-none"
                :style="highlightStyle"></div>

            <!-- Tour Popover Card -->
            <div ref="cardRef" 
                class="fixed z-[9999] w-[350px] max-w-[calc(100vw-2rem)] p-5 rounded-2xl border border-surface-200/60 dark:border-surface-800/60 glass glass-border shadow-2xl flex flex-col gap-4 animate-scale-in"
                :style="cardStyle">
                
                <!-- Card Header -->
                <div class="flex items-start justify-between gap-4">
                    <div class="flex flex-col gap-1">
                        <span class="text-3xs font-bold uppercase tracking-wider text-primary-500 dark:text-primary-400">
                            Editor Guide &bull; Step {{ currentStepIndex + 1 }} of {{ activeSteps.length }}
                        </span>
                        <h3 class="text-sm font-extrabold text-surface-900 dark:text-surface-0 leading-tight">
                            {{ currentStep?.title }}
                        </h3>
                    </div>
                    <button type="button" @click="handleClose" 
                        class="p-1 rounded-full text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 transition-colors cursor-pointer shrink-0">
                        <X class="w-4 h-4" />
                    </button>
                </div>

                <!-- Card Body -->
                <p class="text-xs text-surface-600 dark:text-surface-300 leading-relaxed min-h-[50px]">
                    {{ currentStep?.text }}
                </p>

                <!-- Card Footer -->
                <div class="flex items-center justify-between border-t border-surface-200/50 dark:border-surface-800/50 pt-3.5 mt-1">
                    <button type="button" @click="handleClose" 
                        class="text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-200 font-semibold cursor-pointer">
                        Skip Tour
                    </button>
                    
                    <div class="flex gap-2">
                        <Button v-if="currentStepIndex > 0" label="Back" severity="secondary" size="small" outlined @click="handleBack" class="cursor-pointer py-1! px-2.5!">
                            <template #icon>
                                <ChevronLeft class="w-3.5 h-3.5 mr-1" />
                            </template>
                        </Button>
                        <Button :label="currentStepIndex === activeSteps.length - 1 ? 'Finish' : 'Next'" severity="primary" size="small" @click="handleNext" class="cursor-pointer py-1! px-2.5!">
                            <template #icon>
                                <ChevronRight v-if="currentStepIndex < activeSteps.length - 1" class="w-3.5 h-3.5 order-last ml-1" />
                                <Play v-else class="w-3.5 h-3.5 mr-1" />
                            </template>
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.glass {
    background: rgba(var(--color-surface-0-rgb, 255, 255, 255), 0.85);
    backdrop-filter: blur(16px);
}

.dark .glass {
    background: rgba(var(--color-surface-900-rgb, 15, 23, 42), 0.85);
    backdrop-filter: blur(16px);
}

.animate-scale-in {
    animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}

@keyframes scaleIn {
    from {
        opacity: 0;
        transform: scale(0.96) translate(var(--tw-translate-x), var(--tw-translate-y));
    }
    to {
        opacity: 1;
        transform: scale(1) translate(var(--tw-translate-x), var(--tw-translate-y));
    }
}
</style>
