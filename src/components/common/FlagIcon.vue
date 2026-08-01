<script setup lang="ts">
import { computed } from 'vue';
import { FLAG_SVGS } from '../../assets/flags';

// Drop-in replacement for @placetopay/flagicons-vue's FlagIcon, limited to the 22 flags
// commonLanguages offers. See src/assets/flags.ts for why the dependency went away.
const props = withDefaults(defineProps<{
    flag?: string;
    /** Matches the upstream size scale so call sites did not have to change. */
    size?: 'S' | 'M' | 'L';
    /** Accessible name. Flags are decorative next to their language label, so it defaults to none. */
    label?: string;
}>(), { size: 'M' });

const svg = computed(() => (props.flag ? FLAG_SVGS[props.flag] : undefined));

const sizeClass = computed(() => ({
    S: 'w-4',
    M: 'w-5',
    L: 'w-6',
}[props.size]));
</script>

<template>
    <!-- v-html is safe here: the markup is a compile-time constant from src/assets/flags.ts,
         never user or wiki input, and `flag` can only select an existing key. -->
    <span
        v-if="svg"
        class="inline-block shrink-0 leading-none [&>svg]:w-full [&>svg]:h-auto [&>svg]:block"
        :class="sizeClass"
        :role="label ? 'img' : undefined"
        :aria-label="label || undefined"
        :aria-hidden="label ? undefined : 'true'"
        v-html="svg"
    />
</template>
