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

const missingElements = computed(() => {
    const data = props.formModel;
    const missing: string[] = [];
    if (!data) return missing;

    // Check Cover
    if (!data.infobox.cover || data.infobox.cover === 'GAME TITLE cover.jpg') {
        missing.push('Cover Image');
    }

    // Check Screenshots (Galleries)
    const totalImages = Object.values(data.galleries || {}).reduce((acc, gallery) => acc + gallery.length, 0);
    if (totalImages === 0) {
        missing.push('Screenshots');
    }

    // Check Availability
    const hasAvailability = data.availability?.some(a => a.id || (a.distribution && a.distribution !== 'Steam' && a.distribution !== 'Other'));
    if (!hasAvailability) {
        missing.push('Availability info');
    }

    // Check Developers
    if (data.infobox.developers?.length === 0) {
        missing.push('Developers');
    }

    return missing;
});
</script>

<template>
    <div v-if="formModel && formModel.articleState && formModel.articleState.stub" class="flex flex-col gap-2">
        <Message severity="warn" class="text-sm shadow-sm">
            <template #icon><TriangleAlert class="w-5 h-5 mr-2" /></template>
            <div class="flex flex-col gap-2">
                <div v-if="missingElements.length > 0">
                    <span class="font-bold">Detected Missing:</span> {{ missingElements.join(', ') }}
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
