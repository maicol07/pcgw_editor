<script setup lang="ts">
// Flat section (no card). Sections are separated by a header rule + generous
// spacing; navigation is handled by the section rail.
</script>

<template>
    <section class="scroll-mt-2">
        <header class="flex flex-col gap-1 pb-3 mb-4 border-b border-surface-200/80 dark:border-surface-800/80">
            <div class="flex items-center gap-2.5">
                <slot name="header"></slot>
            </div>
            <p v-if="$slots.subtitle" class="text-xs text-surface-500 dark:text-surface-400">
                <slot name="subtitle"></slot>
            </p>
        </header>
        <slot></slot>
    </section>
</template>
