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
    CheckCircle, AlignLeft, X,
    ListChecks, Link2, MessageSquareWarning,
    Keyboard, FileText, Globe, User, Puzzle
} from 'lucide-vue-next';

import { useReferences } from '../../composables/useReferences';
import WysiwygEditor from './WysiwygEditor.vue';
import CodeEditor from '../CodeEditor.vue';
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
const showRefParamDialog = ref(false);
const currentRefType = ref<'Refcheck' | 'Refurl' | 'cn' | 'key' | 'ilink' | 'wlink' | 'ulink' | 'tlink'>('Refcheck');
const tempRefParams = ref<Record<string, string>>({});

// Initialize new reference or snippet
const addReference = (type: 'Refcheck' | 'Refurl' | 'cn' | 'key' | 'ilink' | 'wlink' | 'ulink' | 'tlink') => {
    // In 'ref' mode we add to the list. In 'note' mode we insert raw text.
    if (props.type === 'ref') {
        const today = new Date().toISOString().split('T')[0];
        const params: Record<string, string> = { date: today };
        if (type === 'Refcheck') params.user = 'User';
        if (type === 'Refurl') { params.url = ''; params.title = ''; }

        references.value.push({ id: crypto.randomUUID(), type: type as any, params });
    } else {
        // For notes, open the dialog to insert the template string
        openRefParamDialog(type);
    }
};

const removeReference = (index: number) => {
    references.value.splice(index, 1);
};

// Note-mode parameter dialog
const openRefParamDialog = (type: 'Refcheck' | 'Refurl' | 'cn' | 'key' | 'ilink' | 'wlink' | 'ulink' | 'tlink') => {
    currentRefType.value = type;
    const today = new Date().toISOString().split('T')[0];
    const params: Record<string, string> = {};

    if (type === 'Refcheck') { params.date = today; params.user = 'User'; }
    if (type === 'Refurl') { params.date = today; params.url = ''; params.title = ''; }
    if (type === 'cn') { params.date = today; }

    if (type === 'key') { params.keys = ''; }
    if (type === 'ilink') { params.page = ''; params.text = ''; }
    if (type === 'wlink') { params.page = ''; params.text = ''; }
    if (type === 'ulink') { params.user = ''; params.id = ''; }
    if (type === 'tlink') { params.template = ''; }

    tempRefParams.value = params;
    showRefParamDialog.value = true;
};

const wysiwygRef = ref<any>(null);

const insertReferenceToNote = () => {
    let template = '';
    const params = cleanParams(tempRefParams.value);

    if (currentRefType.value === 'key') {
        const keys = (params.keys || '').split(',').map(k => k.trim()).filter(Boolean);
        template = keys.length > 0 ? `{{Key|${keys.join('|')}}}` : '';
    } else if (currentRefType.value === 'ilink') {
        template = params.text ? `[[${params.page}|${params.text}]]` : `[[${params.page}]]`;
    } else if (currentRefType.value === 'wlink') {
        template = params.text ? `[[Wikipedia:${params.page}|${params.text}]]` : `[[w|${params.page}]]`;
    } else if (currentRefType.value === 'ulink') {
        template = `{{u|${params.user}|${params.id}}}`;
    } else if (currentRefType.value === 'tlink') {
        template = `{{t|${params.template}}}`;
    } else {
        const paramStr = Object.entries(params).map(([k, v]) => `${k}=${v}`).join('|');
        template = `{{${currentRefType.value}${paramStr ? '|' + paramStr : ''}}}`;
    }

    if (!template) {
        showRefParamDialog.value = false;
        return;
    }

    if (wysiwygRef.value) {
        wysiwygRef.value.insertText(template);
    } else {
        localValue.value += ' ' + template;
    }
    showRefParamDialog.value = false;
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
                <WysiwygEditor ref="wysiwygRef" v-model="localValue">
                    <template #custom-toolbar>
                        <div
                            class="ql-formats flex flex-row flex-wrap gap-x-1 gap-y-2 items-center lg:ml-4 lg:pl-4 lg:border-l border-surface-200 dark:border-surface-700">
                            <Button v-tooltip.bottom="'Refcheck'" text size="small" severity="secondary"
                                class="py-1! px-2! text-sm! w-auto! h-auto!" @click="addReference('Refcheck')">
                                <template #icon>
                                    <ListChecks class="w-4 h-4" />
                                </template>
                            </Button>
                            <Button v-tooltip.bottom="'Refurl'" text size="small" severity="secondary"
                                class="py-1! px-2! text-sm! w-auto! h-auto!" @click="addReference('Refurl')">
                                <template #icon>
                                    <Link2 class="w-4 h-4" />
                                </template>
                            </Button>
                            <Button v-tooltip.bottom="'Citation'" text size="small" severity="secondary"
                                class="py-1! px-2! text-sm! w-auto! h-auto!" @click="addReference('cn')">
                                <template #icon>
                                    <MessageSquareWarning class="w-4 h-4" />
                                </template>
                            </Button>

                            <div class="hidden xl:block w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1"></div>

                            <Button v-tooltip.bottom="'Key'" text size="small" severity="secondary"
                                class="py-1! px-2! text-sm! w-auto! h-auto!" @click="addReference('key')">
                                <template #icon>
                                    <Keyboard class="w-4 h-4" />
                                </template>
                            </Button>
                            <Button v-tooltip.bottom="'Page Link'" text size="small" severity="secondary"
                                class="py-1! px-2! text-sm! w-auto! h-auto!" @click="addReference('ilink')">
                                <template #icon>
                                    <FileText class="w-4 h-4" />
                                </template>
                            </Button>
                            <Button v-tooltip.bottom="'Wiki Link'" text size="small" severity="secondary"
                                class="py-1! px-2! text-sm! w-auto! h-auto!" @click="addReference('wlink')">
                                <template #icon>
                                    <Globe class="w-4 h-4" />
                                </template>
                            </Button>
                            <Button v-tooltip.bottom="'User'" text size="small" severity="secondary"
                                class="py-1! px-2! text-sm! w-auto! h-auto!" @click="addReference('ulink')">
                                <template #icon>
                                    <User class="w-4 h-4" />
                                </template>
                            </Button>
                            <Button v-tooltip.bottom="'Template'" text size="small" severity="secondary"
                                class="py-1! px-2! text-sm! w-auto! h-auto!" @click="addReference('tlink')">
                                <template #icon>
                                    <Puzzle class="w-4 h-4" />
                                </template>
                            </Button>
                        </div>
                    </template>
                </WysiwygEditor>

                <div class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <label class="text-xs font-semibold text-surface-600 dark:text-surface-300 mb-2 block">Wikitext
                        Source
                        (Advanced)</label>
                    <div class="border rounded border-surface-200 dark:border-surface-700 h-48 overflow-hidden">
                        <CodeEditor v-model="localValue" />
                    </div>
                </div>
            </div>

            <div class="flex justify-end gap-2 mt-2">
                <Button label="Cancel" text @click="$emit('update:visible', false)" />
                <Button label="Save" @click="save" />
            </div>
        </div>
    </Dialog>

    <!-- Sub-dialog for Notes References insertion -->
    <Dialog v-model:visible="showRefParamDialog" :header="'Insert ' + currentRefType" modal class="w-full max-w-md">
        <div class="flex flex-col gap-3">
            <div v-if="currentRefType === 'Refcheck'" class="flex flex-col gap-2">
                <InputGroup>
                    <InputGroupAddon>User</InputGroupAddon>
                    <AutoComplete v-model="tempRefParams.user" :suggestions="userSuggestions" @complete="searchUser"
                        class="w-full" />
                </InputGroup>
                <InputGroup>
                    <InputGroupAddon>Date</InputGroupAddon>
                    <InputText v-model="tempRefParams.date" />
                </InputGroup>
                <InputGroup>
                    <InputGroupAddon>Comment</InputGroupAddon>
                    <InputText v-model="tempRefParams.comment" />
                </InputGroup>
            </div>
            <div v-if="currentRefType === 'Refurl'" class="flex flex-col gap-2">
                <InputGroup>
                    <InputGroupAddon>URL</InputGroupAddon>
                    <InputText v-model="tempRefParams.url" />
                </InputGroup>
                <InputGroup>
                    <InputGroupAddon>Title</InputGroupAddon>
                    <InputText v-model="tempRefParams.title" />
                </InputGroup>
                <InputGroup>
                    <InputGroupAddon>Date</InputGroupAddon>
                    <InputText v-model="tempRefParams.date" />
                </InputGroup>
                <InputGroup>
                    <InputGroupAddon>Snippet</InputGroupAddon>
                    <InputText v-model="tempRefParams.snippet" />
                </InputGroup>
            </div>
            <div v-if="currentRefType === 'cn'" class="flex flex-col gap-2">
                <InputGroup>
                    <InputGroupAddon>Date</InputGroupAddon>
                    <InputText v-model="tempRefParams.date" />
                </InputGroup>
                <InputGroup>
                    <InputGroupAddon>Reason</InputGroupAddon>
                    <InputText v-model="tempRefParams.reason" />
                </InputGroup>
            </div>

            <!-- New Snippet Inputs -->
            <div v-if="currentRefType === 'key'" class="flex flex-col gap-2">
                <InputGroup>
                    <InputGroupAddon>Keys</InputGroupAddon>
                    <InputText v-model="tempRefParams.keys" placeholder="e.g. Alt, Enter" />
                </InputGroup>
                <small class="text-surface-500">Separate multiple keys with a comma.</small>
            </div>
            <div v-if="currentRefType === 'ilink' || currentRefType === 'wlink'" class="flex flex-col gap-2">
                <InputGroup>
                    <InputGroupAddon>Page</InputGroupAddon>
                    <InputText v-model="tempRefParams.page" placeholder="Article Title" />
                </InputGroup>
                <InputGroup>
                    <InputGroupAddon>Display Text</InputGroupAddon>
                    <InputText v-model="tempRefParams.text" placeholder="(Optional)" />
                </InputGroup>
            </div>
            <div v-if="currentRefType === 'ulink'" class="flex flex-col gap-2">
                <InputGroup>
                    <InputGroupAddon>Username</InputGroupAddon>
                    <InputText v-model="tempRefParams.user" />
                </InputGroup>
                <InputGroup>
                    <InputGroupAddon>Forum ID</InputGroupAddon>
                    <InputText v-model="tempRefParams.id" />
                </InputGroup>
            </div>
            <div v-if="currentRefType === 'tlink'" class="flex flex-col gap-2">
                <InputGroup>
                    <InputGroupAddon>Template Name</InputGroupAddon>
                    <InputText v-model="tempRefParams.template" />
                </InputGroup>
            </div>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" text @click="showRefParamDialog = false" />
                <Button label="Insert" @click="insertReferenceToNote" />
            </div>
        </div>
    </Dialog>
</template>
