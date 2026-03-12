<script setup lang="ts">
import { useRegisterSW } from 'virtual:pwa-register/vue';
import Button from 'primevue/button';
import { RefreshCw, X, DownloadCloud } from 'lucide-vue-next';

const {
    offlineReady,
    needRefresh,
    updateServiceWorker,
} = useRegisterSW();

const close = () => {
    offlineReady.value = false;
    needRefresh.value = false;
};
</script>

<template>
    <Transition name="slide-up">
        <div v-if="offlineReady || needRefresh" 
            class="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-surface-0 dark:bg-surface-900 shadow-2xl border border-surface-200 dark:border-surface-700 max-w-sm glass"
            role="alert">
            <div class="flex items-start gap-4">
                <div class="p-2.5 bg-primary-500/10 dark:bg-primary-500/20 rounded-xl">
                    <DownloadCloud v-if="offlineReady" class="w-6 h-6 text-primary-500" />
                    <RefreshCw v-else class="w-6 h-6 text-primary-500 animate-spin-slow" />
                </div>
                
                <div class="flex-1 flex flex-col gap-1">
                    <span class="font-bold text-sm text-surface-900 dark:text-surface-0">
                        {{ offlineReady ? 'Ready for offline use' : 'Update available' }}
                    </span>
                    <p class="text-xs text-surface-500 dark:text-surface-400 leading-relaxed">
                        {{ offlineReady 
                            ? 'The application has been cached and is available offline.' 
                            : 'A new version of the app is ready. Reload to apply changes.' 
                        }}
                    </p>
                    
                    <div class="flex items-center gap-2 mt-3">
                        <Button v-if="needRefresh" 
                            label="Reload now" 
                            size="small" 
                            severity="primary" 
                            @click="updateServiceWorker()"
                            class="text-xs! py-1.5! px-3!">
                            <template #icon>
                                <RefreshCw class="w-3.5 h-3.5 mr-1.5" />
                            </template>
                        </Button>
                        <Button label="Close" 
                            size="small" 
                            variant="text" 
                            severity="secondary" 
                            @click="close"
                            class="text-xs! py-1.5! px-3!" />
                    </div>
                </div>

                <button @click="close" 
                    class="p-1 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg transition-colors text-surface-400">
                    <X class="w-4 h-4" />
                </button>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.animate-spin-slow {
    animation: spin 3s linear infinite;
}

@keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
}

.slide-up-enter-active {
    transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-up-leave-active {
    transition: all 0.3s cubic-bezier(0.7, 0, 0.84, 0);
}

.slide-up-enter-from {
    transform: translateY(100%) scale(0.9);
    opacity: 0;
}

.slide-up-leave-to {
    transform: translateY(20px) scale(0.95);
    opacity: 0;
}

.glass {
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}
</style>
