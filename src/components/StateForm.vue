<script setup lang="ts">
import type { ArticleState, GameData } from '../models/GameData';
import { computed } from 'vue';
import Select from 'primevue/select';
import InputText from 'primevue/inputtext';
import Textarea from 'primevue/textarea';
import Checkbox from 'primevue/checkbox';
import InputChips from 'primevue/inputchips';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import Message from 'primevue/message';
import { Filter, Network, TriangleAlert } from 'lucide-vue-next';

const model = defineModel<ArticleState>({ required: true });

const gameStateOptions: { label: string; value: string; icon: string; description: string }[] = [
    { label: 'None', value: '', icon: '⚪', description: 'No development status' },
    { label: 'Prototype', value: 'prototype', icon: '🔬', description: 'Prototype version' },
    { label: 'Development / Early Access', value: 'dev', icon: '🚧', description: 'Active development or EA' },
    { label: 'Post-Development', value: 'postdev', icon: '🔄', description: 'Continued development post-release' },
    { label: 'Unknown', value: 'unknown', icon: '❓', description: 'No updates, unlikely' },
    { label: 'Abandoned', value: 'abandoned', icon: '💀', description: 'Officially cancelled' },
    { label: 'Unplayable', value: 'unplayable', icon: '🚫', description: 'Servers shut down' },
];

const props = defineProps<{ gameData: GameData }>();

const missingElements = computed(() => {
    const missing: string[] = [];
    if (!props.gameData) return missing;

    // Check Cover
    if (!props.gameData.infobox.cover || props.gameData.infobox.cover === 'GAME TITLE cover.jpg') {
        missing.push('Cover Image');
    }



    // Check Screenshots (Galleries)
    const totalImages = Object.values(props.gameData.galleries).reduce((acc, gallery) => acc + gallery.length, 0);
    if (totalImages === 0) {
        missing.push('Screenshots');
    }

    // Check Availability
    const hasAvailability = props.gameData.availability.some(a => a.id || (a.distribution && a.distribution !== 'Steam' && a.distribution !== 'Other'));
    if (!hasAvailability) {
        missing.push('Availability info');
    }

    // Check Developers
    if (props.gameData.infobox.developers.length === 0) {
        missing.push('Developers');
    }

    return missing;
});

</script>

<template>
    <div class="flex flex-col gap-6">
        <!-- Tags & Clarifiers (Disambig/Distinguish) -->
        <div class="p-4 bg-surface-100/50 dark:bg-surface-800/50 rounded-xl border border-surface-200 dark:border-surface-700 flex flex-col gap-4">
            <h3 class="text-sm font-semibold uppercase tracking-wider text-surface-500">Clarification Tags</h3>
            
            <div class="flex flex-col gap-2">
                <label class="font-medium text-sm text-surface-600 dark:text-surface-300">
                    Disambig (This page is...)
                </label>
                <InputGroup>
                    <InputGroupAddon>
                        <Filter class="w-4 h-4" />
                    </InputGroupAddon>
                    <InputText 
                        v-model="model.disambig" 
                        placeholder="e.g. the original game"
                        class="w-full"
                    />
                </InputGroup>
                <p class="text-[10px] text-surface-500">Used to distinguish movies/books or other games with the same name.</p>
            </div>

            <div class="flex flex-col gap-2">
                <label class="font-medium text-sm text-surface-600 dark:text-surface-300">
                    Distinguish (Related pages)
                </label>
                <InputGroup class="flex-1">
                     <InputGroupAddon>
                        <Network class="w-4 h-4" />
                    </InputGroupAddon>
                    <InputChips 
                        v-model="model.distinguish" 
                        placeholder="Type page name and press enter"
                        class="w-full"
                    />
                </InputGroup>
                <p class="text-[10px] text-surface-500">List closely related but not identical titles.</p>
            </div>
        </div>

        <!-- Flags -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="flex flex-col gap-4">
                <div class="flex items-center gap-3 p-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <Checkbox v-model="model.stub" :binary="true" inputId="flag-stub" />
                    <label for="flag-stub" class="flex flex-col cursor-pointer">
                        <span class="font-semibold text-sm">Stub</span>
                        <span class="text-xs text-surface-500">Missing minimum requirements.</span>
                    </label>
                </div>
                <div v-if="model.stub" class="flex flex-col gap-2">
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

                <div class="flex flex-col gap-2 p-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <div class="flex items-center gap-3">
                        <Checkbox v-model="model.cleanup" :binary="true" inputId="flag-cleanup" />
                        <label for="flag-cleanup" class="flex flex-col cursor-pointer">
                            <span class="font-semibold text-sm">Needs Cleanup</span>
                            <span class="text-xs text-surface-500">Formatting or outdated content.</span>
                        </label>
                    </div>
                    <div v-if="model.cleanup" class="pt-2">
                        <Textarea v-model="model.cleanupDescription" placeholder="Cleanup reason..." rows="2" autoResize class="text-sm w-full" />
                    </div>
                </div>
            </div>

            <div class="flex flex-col gap-4">
                <div class="flex flex-col gap-2 p-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <div class="flex items-center gap-3">
                        <Checkbox v-model="model.delete" :binary="true" inputId="flag-delete" />
                        <label for="flag-delete" class="flex flex-col cursor-pointer">
                            <span class="font-semibold text-sm">Delete Request</span>
                            <span class="text-xs text-surface-500">Remove this page from wiki.</span>
                        </label>
                    </div>
                    <div v-if="model.delete" class="pt-2">
                        <Textarea v-model="model.deleteReason" placeholder="Reason for deletion..." rows="2" autoResize class="text-sm w-full" />
                    </div>
                </div>

                <div class="flex flex-col gap-2 p-3 bg-surface-50 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg">
                    <label class="font-semibold text-sm">Development State</label>
                    <Select 
                        v-model="model.state" 
                        :options="gameStateOptions" 
                        optionLabel="label"
                        optionValue="value"
                        placeholder="Normal"
                        size="small"
                        class="w-full"
                    >
                        <template #value="slotProps">
                            <div v-if="slotProps.value" class="flex items-center gap-2">
                                <span>{{ gameStateOptions.find(o => o.value === slotProps.value)?.icon }}</span>
                                <span class="text-xs">{{ gameStateOptions.find(o => o.value === slotProps.value)?.label }}</span>
                            </div>
                            <span v-else class="text-xs text-surface-400 font-normal">None (Standard)</span>
                        </template>
                    </Select>
                </div>
            </div>
        </div>
    </div>
</template>
