<script setup lang="ts">
// Flat section (no card). Sections are separated by a header rule + generous
// spacing; navigation is handled by the section rail.
</script>

<template>
    <section class="scroll-mt-2">
        <header
            class="flex items-center gap-2.5 pb-2.5 mb-4 border-b border-surface-200/80 dark:border-surface-800/80">
            <slot name="header"></slot>
        </header>
        <slot></slot>
    </section>
</template>
