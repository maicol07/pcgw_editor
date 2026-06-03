<script setup lang="ts">
import { ref, watch, onUnmounted } from 'vue';
import { rateLimitState } from '../../config/api';
import { Hourglass, Loader2 } from 'lucide-vue-next';

const remainingSeconds = ref(0);
let timerId: any = null;

const updateRemaining = () => {
    const remainingMs = rateLimitState.value.resetTime - Date.now();
    remainingSeconds.value = Math.max(0, Math.ceil(remainingMs / 1000));
};

watch(
    () => rateLimitState.value.isRateLimited,
    (isLimited) => {
        if (isLimited) {
            updateRemaining();
            if (!timerId) {
                timerId = setInterval(updateRemaining, 1000);
            }
        } else {
            if (timerId) {
                clearInterval(timerId);
                timerId = null;
            }
            remainingSeconds.value = 0;
        }
    },
    { immediate: true }
);

watch(
    () => rateLimitState.value.resetTime,
    () => {
        if (rateLimitState.value.isRateLimited) {
            updateRemaining();
        }
    }
);

onUnmounted(() => {
    if (timerId) clearInterval(timerId);
});
</script>

<template>
    <Transition name="slide-down">
        <div v-if="rateLimitState.isRateLimited && remainingSeconds > 0" 
            class="px-4 py-2.5 bg-amber-500/10 dark:bg-amber-500/5 border-b border-amber-500/20 backdrop-blur-md flex items-center justify-between gap-3 text-amber-700 dark:text-amber-400 text-xs font-medium z-10 shrink-0"
            role="alert">
            <div class="flex items-center gap-2.5">
                <div class="p-1 bg-amber-500/20 rounded-md animate-pulse">
                    <Hourglass class="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                </div>
                <div class="flex flex-col md:flex-row md:items-center gap-0.5 md:gap-2">
                    <span class="font-bold">Rate Limit Active</span>
                    <span class="text-amber-600/80 dark:text-amber-400/70">
                        PCGamingWiki request limit reached. Waiting {{ remainingSeconds }}s before processing more requests.
                    </span>
                </div>
            </div>
            
            <div class="flex items-center gap-2 shrink-0">
                <span v-if="rateLimitState.queueLength > 0" class="px-2 py-0.5 bg-amber-500/20 rounded-full text-[10px] font-semibold flex items-center gap-1">
                    <Loader2 class="w-2.5 h-2.5 animate-spin" />
                    {{ rateLimitState.queueLength }} queued
                </span>
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
