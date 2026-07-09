<script setup lang="ts">
import { computed } from 'vue';
import { GameData } from '../models/GameData';
import Message from 'primevue/message';
import { TriangleAlert } from 'lucide-vue-next';

// This component receives the whole GameData object (or at least articleState + others)
// But DynamicField passes `formModel` which is `modelValue` of DynamicSection.
// For ArticleState section, `formModel` is `gameData` (if mapped to root) or `gameData.articleState`?
// In DynamicSection usage, `modelValue` passed to it depends on how it's called.
// In InfoboxForm (Step 629), `DynamicSection` is used for `fieldsConfig` items.
// If the section ID is `article_state`, what is passed?
// If `article_state` is a root section, `modelValue` passed to DynamicSection is likely `gameData`.
// Let's assume it receives the full object needed for validation if we map it correctly. This component might need to inject `gameData` if `formModel` is just `articleState`.
// But for "Stub" calculation we need `infobox` data too.
// So this component should probably use `inject('gameData')` or similar if available, OR we assume `formModel` IS `gameData`.
// Wait, `DynamicSection` gets `modelValue`.
// In `InfoboxForm.vue`:
// `<DynamicSection :section="s" v-model="localGameData" ... />`
// So `modelValue` IS `gameData`.
// So `formModel` passed to DynamicField IS `gameData`.
// EXCELLENT.

const props = defineProps<{
    formModel: GameData; // This will be the full gameData
    // DynamicField passes it as `formModel`
}>();

interface ChecklistItem {
    label: string;
    sectionKey: string; // DOM anchor `sec-<key>`
    complete: boolean;
}

const checklist = computed<ChecklistItem[]>(() => {
    const data = props.formModel;
    if (!data) return [];

    const totalImages = Object.values(data.galleries || {}).reduce((acc, gallery) => acc + gallery.length, 0);
    const hasAvailability = data.availability?.some(a => a.id || (a.distribution && a.distribution !== 'Steam' && a.distribution !== 'Other'));

    return [
        {
            label: 'Cover Image',
            sectionKey: 'infobox',
            complete: !!data.infobox.cover && data.infobox.cover !== 'GAME TITLE cover.jpg',
        },
        {
            label: 'Screenshots',
            sectionKey: 'video',
            complete: totalImages > 0,
        },
        {
            label: 'Availability info',
            sectionKey: 'availability',
            complete: !!hasAvailability,
        },
        {
            label: 'Developers',
            sectionKey: 'infobox',
            complete: (data.infobox.developers?.length ?? 0) > 0,
        },
    ];
});

const missingElements = computed(() => checklist.value.filter(i => !i.complete));
const completedCount = computed(() => checklist.value.filter(i => i.complete).length);

const scrollToSection = (key: string) => {
    const el = document.getElementById(`sec-${key}`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.classList.add('stub-highlight');
    window.setTimeout(() => el.classList.remove('stub-highlight'), 1600);
};
</script>

<template>
    <div v-if="formModel && formModel.articleState && formModel.articleState.stub" class="flex flex-col gap-2">
        <Message severity="warn" class="text-sm shadow-sm">
            <template #icon><TriangleAlert class="w-6 h-6 mr-2 shrink-0" /></template>
            <div class="flex flex-col gap-2">
                <div class="flex items-center gap-2">
                    <span class="font-bold">Required elements</span>
                    <span class="text-xs font-semibold px-1.5 py-0.5 rounded bg-surface-200/70 dark:bg-surface-700/70 text-surface-600 dark:text-surface-200">
                        {{ completedCount }}/{{ checklist.length }} complete
                    </span>
                </div>
                <div v-if="missingElements.length > 0" class="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span class="font-bold">Detected Missing:</span>
                    <template v-for="(item, i) in missingElements" :key="item.label">
                        <button type="button" @click="scrollToSection(item.sectionKey)"
                            class="text-primary-600 dark:text-primary-400 underline underline-offset-2 hover:text-primary-700 dark:hover:text-primary-300 cursor-pointer">
                            {{ item.label }}
                        </button><span v-if="i < missingElements.length - 1" class="text-surface-400">,</span>
                    </template>
                </div>
                <div v-else class="text-green-600 dark:text-green-400 font-medium">
                    No obvious missing elements detected. Verify manual data.
                </div>
                <p class="mb-2">The stub tag is for pages that do not meet minimum requirements for a "proper" article. This can include tables with no data, no screenshots present, and missing article elements/tables.</p>
                <p class="font-medium">The tag should only be removed once all the required tables and screenshots are added/filled in.</p>
            </div>
        </Message>
    </div>
</template>

<style>
.stub-highlight {
    animation: stub-highlight-pulse 1.6s ease-out;
    border-radius: 0.5rem;
}

@keyframes stub-highlight-pulse {
    0% { box-shadow: 0 0 0 0 rgba(51, 122, 190, 0); }
    20% { box-shadow: 0 0 0 4px rgba(51, 122, 190, 0.45); }
    100% { box-shadow: 0 0 0 0 rgba(51, 122, 190, 0); }
}
</style>
