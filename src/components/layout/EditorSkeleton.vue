<script setup lang="ts">
import { Loader2 } from 'lucide-vue-next';
</script>

<template>
    <div class="p-4 md:p-5 max-w-6xl mx-auto flex flex-col gap-4" key="skeleton">
        <div class="h-12 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
        <div class="h-32 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
        <div class="h-24 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
        <div class="h-48 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
        <div class="h-32 bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"></div>
        <div class="flex items-center justify-center h-32">
            <div class="flex flex-col items-center gap-3">
                <Loader2 class="w-8 h-8 animate-spin text-primary-500" />
                <span class="text-surface-500 dark:text-surface-400 text-sm font-medium">Loading editor...</span>
            </div>
        </div>
    </div>
</template>
