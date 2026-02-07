<script setup lang="ts">
import { ref, computed } from 'vue';
import { List, X, ChevronRight, ChevronDown } from 'lucide-vue-next';

export interface Heading {
    id: string;
    text: string;
    level: number;
}

const props = defineProps<{
    headings: Heading[];
}>();

const emit = defineEmits<{
    (e: 'scroll', id: string): void;
}>();

const isOpen = ref(false);

const toggleLegend = () => {
    isOpen.value = !isOpen.value;
};

const handleHeadingClick = (id: string) => {
    emit('scroll', id);
    // Optional: close on click on mobile? keeping it open for now
};

</script>

<template>
    <div class="absolute top-4 right-4 z-50 flex flex-col items-end gap-2 pointer-events-none">

        <!-- FAB -->
        <button @click="toggleLegend"
            class="pointer-events-auto h-10 w-10 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 bg-surface-0 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-300 hover:text-primary-500 dark:hover:text-primary-400"
            :class="{ 'rotate-90': isOpen }" v-tooltip.left="'Table of Contents'">
            <X v-if="isOpen" class="w-5 h-5" />
            <List v-else class="w-5 h-5" />
        </button>

        <!-- Legend Panel -->
        <Transition enter-active-class="transition duration-200 ease-out"
            enter-from-class="opacity-0 translate-y-2 scale-95" enter-to-class="opacity-100 translate-y-0 scale-100"
            leave-active-class="transition duration-150 ease-in" leave-from-class="opacity-100 translate-y-0 scale-100"
            leave-to-class="opacity-0 translate-y-2 scale-95">
            <div v-if="isOpen"
                class="pointer-events-auto w-64 max-h-[60vh] overflow-y-auto custom-scrollbar bg-surface-0/95 dark:bg-surface-900/95 backdrop-blur shadow-xl rounded-xl border border-surface-200 dark:border-surface-700 p-2 flex flex-col gap-0.5">
                <div v-if="headings.length === 0" class="p-4 text-center text-xs text-surface-500 italic">
                    No sections found
                </div>

                <button v-for="heading in headings" :key="heading.id" @click="handleHeadingClick(heading.id)"
                    class="text-left px-3 py-2 rounded-lg text-sm transition-colors hover:bg-surface-100 dark:hover:bg-surface-800 text-surface-600 dark:text-surface-300 hover:text-primary-600 dark:hover:text-primary-400 truncate w-full cursor-pointer"
                    :class="{
                        'pl-3 font-semibold': heading.level === 2,
                        'pl-6 text-xs': heading.level === 3,
                        'pl-9 text-xs': heading.level > 3
                    }" :title="heading.text">
                    {{ heading.text }}
                </button>
            </div>
        </Transition>
    </div>
</template>
