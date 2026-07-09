<script setup lang="ts">
import { ref } from 'vue';
import { syncState, reconnectSync } from '../../services/sync/syncService';
import { Cloud, AlertCircle, Loader2 } from 'lucide-vue-next';
import Button from 'primevue/button';
import { useToast } from 'primevue/usetoast';

const toast = useToast();
const isReconnecting = ref(false);

const handleReconnect = async () => {
    isReconnecting.value = true;
    try {
        await reconnectSync();
        toast.add({ severity: 'success', summary: 'Sync restored', detail: 'Successfully reconnected to Google Drive.', life: 3000 });
    } catch (e: any) {
        toast.add({ severity: 'error', summary: 'Reconnection failed', detail: e.message || 'Failed to reconnect.', life: 4000 });
    } finally {
        isReconnecting.value = false;
    }
};
</script>

<template>
    <Transition name="slide-down">
        <div v-if="syncState.unlocked && !syncState.connected" 
            class="px-4 py-2.5 bg-amber-500/10 dark:bg-amber-500/5 border-b border-amber-500/20 backdrop-blur-md flex items-center justify-between gap-3 text-amber-700 dark:text-amber-400 text-xs font-medium z-10 shrink-0"
            role="alert">
            <div class="flex items-center gap-2.5">
                <div class="p-1 bg-amber-500/20 rounded-md flex items-center justify-center shrink-0">
                    <Cloud class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div class="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2">
                    <span class="font-bold flex items-center gap-1">
                        <AlertCircle class="w-3 h-3 text-amber-500" />
                        Sync Paused
                    </span>
                    <span class="text-amber-600/80 dark:text-amber-400/70">
                        Google Drive session expired. Reconnect to resume synchronization of workspaces and settings.
                    </span>
                </div>
            </div>
            
            <div class="flex items-center gap-2 shrink-0">
                <Button 
                    label="Reconnect" 
                    severity="warn" 
                    size="small" 
                    :disabled="isReconnecting" 
                    @click="handleReconnect" 
                    class="px-2.5 py-1 text-2xs! font-bold! rounded-md! cursor-pointer! shadow-xs"
                >
                    <template #icon>
                        <Loader2 v-if="isReconnecting" class="w-3 h-3 mr-1 animate-spin" />
                    </template>
                </Button>
            </div>
        </div>
    </Transition>
</template>

<style scoped>
.slide-down-enter-active,
.slide-down-leave-active {
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.slide-down-enter-from,
.slide-down-leave-to {
    transform: translateY(-100%);
    opacity: 0;
}
</style>
