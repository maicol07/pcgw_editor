<script setup lang="ts">
import { ref, watch } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputText from 'primevue/inputtext';
import AutoComplete from 'primevue/autocomplete';
import {
    Check, Link, CircleHelp,
    CheckCircle, AlignLeft, X
} from 'lucide-vue-next';

import { useReferences } from '../../composables/useReferences';
import WysiwygEditor from './WysiwygEditor.vue';
import type { ReferenceItem } from '../../types/references';

const props = defineProps<{
    visible: boolean;
    modelValue?: string;
    type?: 'note' | 'ref';
    title?: string;
}>();

const emit = defineEmits<{
    (e: 'update:visible', value: boolean): void;
    (e: 'update:modelValue', value: string): void;
}>();

// Composables
const { parseReferences, serializeReferences, cleanParams } = useReferences();

// State
const localValue = ref('');
const references = ref<ReferenceItem[]>([]);

// Sync prop to local
watch(() => props.visible, (isVisible) => {
    if (isVisible) {
        localValue.value = props.modelValue || '';
        if (props.type === 'ref') {
            references.value = parseReferences(localValue.value);
        } else {
            // For notes, we rely on WysiwygEditor to handle the conversion and preview
        }
    }
});

// Save Logic
const save = () => {
    if (props.type === 'ref') {
        const cleanedRefs = references.value.map(ref => ({
            ...ref,
            params: cleanParams(ref.params)
        }));
        localValue.value = serializeReferences(cleanedRefs);
    }
    emit('update:modelValue', localValue.value);
    emit('update:visible', false);
};

// --- Reference/Snippet Mode Logic ---

// Initialize new reference or snippet
const addReference = (type: 'Refcheck' | 'Refurl' | 'cn' | 'key' | 'ilink' | 'wlink' | 'ulink' | 'tlink') => {
    // In 'ref' mode we add to the list. In 'note' mode we insert raw text.
    if (props.type === 'ref') {
        const today = new Date().toISOString().split('T')[0];
        const params: Record<string, string> = { date: today };
        if (type === 'Refcheck') params.user = 'User';
        if (type === 'Refurl') { params.url = ''; params.title = ''; }

        references.value.push({ id: crypto.randomUUID(), type: type as any, params });
    }
};

import { pcgwApi } from '../../services/pcgwApi';
import { useDebounceFn } from '@vueuse/core';

// ... (imports remain)

// User Autocomplete (Shared)
const userSuggestions = ref<string[]>([]);

// Debounced search using API service
const searchUser = useDebounceFn(async (event: { query: string }) => {
    userSuggestions.value = await pcgwApi.searchUsers(event.query);
}, 300);

</script>

<template>
    <Dialog :visible="visible" @update:visible="$emit('update:visible', $event)"
        :header="title || (type === 'ref' ? 'References' : 'Edit Notes')" modal
        :class="type === 'note' ? 'w-full max-w-6xl' : 'w-full max-w-2xl'">
        <div class="flex flex-col gap-4">

            <!-- Reference Mode UI -->
            <div v-if="type === 'ref'" class="flex flex-col gap-3">
                <div class="flex gap-2 mb-2">
                    <Button label="Refcheck" size="small" severity="secondary" variant="outlined"
                        @click="addReference('Refcheck')">
                        <template #icon>
                            <Check class="w-4 h-4" />
                        </template>
                    </Button>
                    <Button label="Refurl" size="small" severity="secondary" variant="outlined"
                        @click="addReference('Refurl')">
                        <template #icon>
                            <Link class="w-4 h-4" />
                        </template>
                    </Button>
                    <Button label="Citation" size="small" severity="secondary" variant="outlined"
                        @click="addReference('cn')">
                        <template #icon>
                            <CircleHelp class="w-4 h-4" />
                        </template>
                    </Button>
                </div>

                <div v-if="references.length === 0"
                    class="text-surface-500 italic text-center py-4 border border-dashed rounded border-surface-300 dark:border-surface-700">
                    No references added.
                </div>

                <div v-else class="max-h-[60vh] overflow-y-auto pr-2 rounded flex flex-col gap-3">
                    <div v-for="(ref, index) in references" :key="ref.id"
                        class="p-3 border rounded border-surface-200 dark:border-surface-700 relative bg-surface-50 dark:bg-surface-900 shadow-sm">

                        <!-- Header -->
                        <div
                            class="flex justify-between items-center mb-2 border-b pb-2 border-surface-200 dark:border-surface-700">
                            <div class="font-bold flex items-center gap-2">
                                <CheckCircle v-if="ref.type === 'Refcheck'" class="text-primary-600 w-4 h-4" />
                                <Link v-if="ref.type === 'Refurl'" class="text-primary-600 w-4 h-4" />
                                <CircleHelp v-if="ref.type === 'cn'" class="text-orange-500 w-4 h-4" />
                                <AlignLeft v-if="ref.type === 'text'" class="text-surface-500 w-4 h-4" />
                                <span
                                    :class="{ 'text-primary-600': ref.type !== 'cn' && ref.type !== 'text', 'text-orange-500': ref.type === 'cn' }">
                                    {{ ref.type }}
                                </span>
                            </div>
                            <Button text rounded severity="danger" size="small" @click="removeReference(index)">
                                <template #icon>
                                    <X class="w-4 h-4" />
                                </template>
                            </Button>
                        </div>

                        <!-- Refcheck Fields -->
                        <div v-if="ref.type === 'Refcheck'" class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <InputGroup>
                                <InputGroupAddon>User</InputGroupAddon>
                                <AutoComplete v-model="ref.params.user" :suggestions="userSuggestions"
                                    @complete="searchUser" class="w-full flex-1" />
                            </InputGroup>
                            <InputGroup>
                                <InputGroupAddon>Date</InputGroupAddon>
                                <InputText v-model="ref.params.date" />
                            </InputGroup>
                            <InputGroup class="col-span-full">
                                <InputGroupAddon>Comment</InputGroupAddon>
                                <InputText v-model="ref.params.comment" />
                            </InputGroup>
                        </div>

                        <!-- Refurl Fields -->
                        <div v-if="ref.type === 'Refurl'" class="flex flex-col gap-2">
                            <InputGroup>
                                <InputGroupAddon>URL</InputGroupAddon>
                                <InputText v-model="ref.params.url" />
                            </InputGroup>
                            <div class="grid grid-cols-2 gap-2">
                                <InputGroup>
                                    <InputGroupAddon>Title</InputGroupAddon>
                                    <InputText v-model="ref.params.title" />
                                </InputGroup>
                                <InputGroup>
                                    <InputGroupAddon>Date</InputGroupAddon>
                                    <InputText v-model="ref.params.date" />
                                </InputGroup>
                            </div>
                            <InputGroup>
                                <InputGroupAddon>Snippet</InputGroupAddon>
                                <InputText v-model="ref.params.snippet" />
                            </InputGroup>
                        </div>

                        <!-- CN Fields -->
                        <div v-if="ref.type === 'cn'" class="grid grid-cols-2 gap-2">
                            <InputGroup>
                                <InputGroupAddon>Date</InputGroupAddon>
                                <InputText v-model="ref.params.date" />
                            </InputGroup>
                            <InputGroup>
                                <InputGroupAddon>Reason</InputGroupAddon>
                                <InputText v-model="ref.params.reason" />
                            </InputGroup>
                        </div>

                        <!-- Text Content -->
                        <div v-if="ref.type === 'text'">
                            <Textarea v-model="ref.content" rows="2" autoResize class="w-full" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Note Mode UI -->
            <div v-else class="flex flex-col gap-3">
                <WysiwygEditor v-model="localValue" />
            </div>

            <div class="flex justify-end gap-2 mt-2">
                <Button label="Cancel" text @click="$emit('update:visible', false)" />
                <Button label="Save" @click="save" />
            </div>
        </div>
    </Dialog>
</template>
