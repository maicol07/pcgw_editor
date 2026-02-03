<script setup lang="ts">
import { ref, watch, computed, nextTick } from 'vue';
import Dialog from 'primevue/dialog';
import Button from 'primevue/button';
import Textarea from 'primevue/textarea';
import Toolbar from 'primevue/toolbar';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputText from 'primevue/inputtext';
import AutoComplete from 'primevue/autocomplete';
import { 
  Check, Link, CircleHelp, List, Code, ExternalLink, 
  CheckCircle, AlignLeft, X 
} from 'lucide-vue-next';

import { useReferences } from '../../composables/useReferences';
import { useWikitextEditor } from '../../composables/useWikitextEditor';
import { renderWikitextToHtml } from '../../utils/renderer';
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
const { insertFormatting, insertList } = useWikitextEditor();

// State
const localValue = ref('');
const references = ref<ReferenceItem[]>([]);
const previewHtml = ref('');

// Sync prop to local
watch(() => props.visible, (isVisible) => {
    if (isVisible) {
        localValue.value = props.modelValue || '';
        if (props.type === 'ref') {
            references.value = parseReferences(localValue.value);
        } else {
            updatePreview();
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

// --- Note Mode Logic (WYSIWYG) ---
const textareaRef = ref<any>(null);

const applyFormat = (formatType: 'bold' | 'italic' | 'link' | 'code') => {
    const el = textareaRef.value?.$el as HTMLTextAreaElement;
    if (!el) return;

    let res;
    if (formatType === 'bold') res = insertFormatting(el, localValue.value, "'''", "'''");
    else if (formatType === 'italic') res = insertFormatting(el, localValue.value, "''", "''");
    else if (formatType === 'link') res = insertFormatting(el, localValue.value, "[[", "]]", "link");
    else if (formatType === 'code') res = insertFormatting(el, localValue.value, "<code>", "</code>", "code");

    if (res) {
        localValue.value = res.text;
        nextTick(() => {
            el.focus();
            el.setSelectionRange(res!.newCursorPos, res!.newCursorPos);
        });
    }
};

const applyList = (listType: '*' | '#') => {
    const el = textareaRef.value?.$el as HTMLTextAreaElement;
    if (!el) return;
    
    const res = insertList(el, localValue.value, listType);
    if (res) {
        localValue.value = res.text;
        nextTick(() => {
            el.focus();
            el.setSelectionRange(res!.newCursorPos, res!.newCursorPos);
        });
    }
};

const updatePreview = () => {
    if (props.type === 'note' && localValue.value) {
        previewHtml.value = renderWikitextToHtml(localValue.value);
    } else {
        previewHtml.value = '';
    }
};
watch(localValue, () => {
    if (props.type === 'note') updatePreview();
});

// --- Reference Mode Logic ---
const showRefParamDialog = ref(false);
const currentRefType = ref<'Refcheck' | 'Refurl' | 'cn'>('Refcheck');
const tempRefParams = ref<Record<string, string>>({});

// Initialize new reference
const addReference = (type: 'Refcheck' | 'Refurl' | 'cn') => {
    // In 'ref' mode we add to the list. In 'note' mode we insert raw text.
    if (props.type === 'ref') {
         const today = new Date().toISOString().split('T')[0];
         const params: Record<string, string> = { date: today };
         if (type === 'Refcheck') params.user = 'User';
         if (type === 'Refurl') { params.url = ''; params.title = ''; }
         
         references.value.push({ id: crypto.randomUUID(), type, params });
    } else {
        // For notes, open the dialog to insert the template string
        openRefParamDialog(type);
    }
};

const removeReference = (index: number) => {
    references.value.splice(index, 1);
};

// Note-mode reference insertion dialog
const openRefParamDialog = (type: 'Refcheck' | 'Refurl' | 'cn') => {
    currentRefType.value = type;
    const today = new Date().toISOString().split('T')[0];
    const params: Record<string, string> = { date: today };
    if (type === 'Refcheck') { params.user = 'User'; }
    if (type === 'Refurl') { params.url = ''; params.title = ''; }
    
    tempRefParams.value = params;
    showRefParamDialog.value = true;
};

const insertReferenceToNote = () => {
    const params = cleanParams(tempRefParams.value);
    const paramStr = Object.entries(params).map(([k,v]) => `${k}=${v}`).join('|');
    const template = `{{${currentRefType.value}${paramStr ? '|' + paramStr : ''}}}`;
    
    const el = textareaRef.value?.$el as HTMLTextAreaElement;
    if (!el) {
        localValue.value += ' ' + template;
    } else {
        const res = insertFormatting(el, localValue.value, template, ''); // insert at cursor
        if (res) {
             localValue.value = res.text;
             nextTick(() => { el.focus(); el.setSelectionRange(res!.newCursorPos, res!.newCursorPos); });
        }
    }
    showRefParamDialog.value = false;
};


// User Autocomplete (Shared)
const userSuggestions = ref<string[]>([]);
const searchUser = async (event: { query: string }) => {
    if (!event.query || event.query.length < 2) return;
    try {
        const response = await fetch(`https://www.pcgamingwiki.com/w/api.php?action=query&list=allusers&auprefix=${event.query}&format=json&origin=*`);
        const data = await response.json();
        if (data.query && data.query.allusers) {
            userSuggestions.value = data.query.allusers.map((u: any) => u.name);
        }
    } catch (e) {
        console.error("Failed to fetch users", e);
    }
};

</script>

<template>
    <Dialog 
        :visible="visible" 
        @update:visible="$emit('update:visible', $event)" 
        :header="title || (type === 'ref' ? 'References' : 'Edit Notes')" 
        modal 
        :class="type === 'note' ? 'w-full max-w-6xl' : 'w-full max-w-2xl'"
    >
        <div class="flex flex-col gap-4">
            
            <!-- Reference Mode UI -->
            <div v-if="type === 'ref'" class="flex flex-col gap-3">
                 <div class="flex gap-2 mb-2">
                    <Button label="Refcheck" size="small" severity="secondary" variant="outlined" @click="addReference('Refcheck')">
                        <template #icon><Check class="w-4 h-4" /></template>
                    </Button>
                    <Button label="Refurl" size="small" severity="secondary" variant="outlined" @click="addReference('Refurl')">
                        <template #icon><Link class="w-4 h-4" /></template>
                    </Button>
                    <Button label="Citation" size="small" severity="secondary" variant="outlined" @click="addReference('cn')">
                        <template #icon><CircleHelp class="w-4 h-4" /></template>
                    </Button>
                </div>

                <div v-if="references.length === 0" class="text-surface-500 italic text-center py-4 border border-dashed rounded border-surface-300 dark:border-surface-700">
                    No references added.
                </div>

                <div v-else class="max-h-[60vh] overflow-y-auto pr-2 rounded flex flex-col gap-3">
                    <div v-for="(ref, index) in references" :key="ref.id" class="p-3 border rounded border-surface-200 dark:border-surface-700 relative bg-surface-50 dark:bg-surface-900 shadow-sm">
                        
                        <!-- Header -->
                        <div class="flex justify-between items-center mb-2 border-b pb-2 border-surface-200 dark:border-surface-700">
                            <div class="font-bold flex items-center gap-2">
                                <CheckCircle v-if="ref.type === 'Refcheck'" class="text-primary-600 w-4 h-4" />
                                <Link v-if="ref.type === 'Refurl'" class="text-primary-600 w-4 h-4" />
                                <CircleHelp v-if="ref.type === 'cn'" class="text-orange-500 w-4 h-4" />
                                <AlignLeft v-if="ref.type === 'text'" class="text-surface-500 w-4 h-4" />
                                <span :class="{'text-primary-600': ref.type !== 'cn' && ref.type !== 'text', 'text-orange-500': ref.type === 'cn'}">
                                    {{ ref.type }}
                                </span>
                            </div>
                            <Button text rounded severity="danger" size="small" @click="removeReference(index)">
                                <template #icon><X class="w-4 h-4" /></template>
                            </Button>
                        </div>

                        <!-- Refcheck Fields -->
                        <div v-if="ref.type === 'Refcheck'" class="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <InputGroup>
                                <InputGroupAddon>User</InputGroupAddon>
                                <AutoComplete v-model="ref.params.user" :suggestions="userSuggestions" @complete="searchUser" class="w-full flex-1" />
                            </InputGroup>
                            <InputGroup><InputGroupAddon>Date</InputGroupAddon><InputText v-model="ref.params.date" /></InputGroup>
                            <InputGroup class="col-span-full"><InputGroupAddon>Comment</InputGroupAddon><InputText v-model="ref.params.comment" /></InputGroup>
                        </div>

                        <!-- Refurl Fields -->
                        <div v-if="ref.type === 'Refurl'" class="flex flex-col gap-2">
                            <InputGroup><InputGroupAddon>URL</InputGroupAddon><InputText v-model="ref.params.url" /></InputGroup>
                            <div class="grid grid-cols-2 gap-2">
                                <InputGroup><InputGroupAddon>Title</InputGroupAddon><InputText v-model="ref.params.title" /></InputGroup>
                                <InputGroup><InputGroupAddon>Date</InputGroupAddon><InputText v-model="ref.params.date" /></InputGroup>
                            </div>
                            <InputGroup><InputGroupAddon>Snippet</InputGroupAddon><InputText v-model="ref.params.snippet" /></InputGroup>
                        </div>

                        <!-- CN Fields -->
                        <div v-if="ref.type === 'cn'" class="grid grid-cols-2 gap-2">
                            <InputGroup><InputGroupAddon>Date</InputGroupAddon><InputText v-model="ref.params.date" /></InputGroup>
                            <InputGroup><InputGroupAddon>Reason</InputGroupAddon><InputText v-model="ref.params.reason" /></InputGroup>
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
                 <Toolbar class="!p-2 !border !rounded">
                    <template #start>
                        <div class="flex gap-1 flex-wrap">
                            <Button label="B" text size="small" severity="secondary" @click="applyFormat('bold')" class="!font-bold !min-w-[2rem]" />
                            <Button label="I" text size="small" severity="secondary" @click="applyFormat('italic')" class="!italic !min-w-[2rem]" />
                            <Button text size="small" severity="secondary" @click="applyFormat('link')"><template #icon><Link class="w-4 h-4" /></template></Button>
                            <div class="h-6 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                            <Button text size="small" severity="secondary" @click="applyList('*')"><template #icon><List class="w-4 h-4" /></template></Button>
                            <Button label="1." text size="small" severity="secondary" @click="applyList('#')" class="!min-w-[2rem]" />
                            <Button text size="small" severity="secondary" @click="applyFormat('code')"><template #icon><Code class="w-4 h-4" /></template></Button>
                            <div class="h-6 w-px bg-surface-300 dark:bg-surface-600 mx-1"></div>
                            <Button label="Refcheck" text size="small" severity="secondary" @click="addReference('Refcheck')" />
                            <Button label="Refurl" text size="small" severity="secondary" @click="addReference('Refurl')" />
                            <Button label="Citation" text size="small" severity="secondary" @click="addReference('cn')" />
                        </div>
                    </template>
                </Toolbar>

                <div class="grid grid-cols-2 gap-3">
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Wikitext Source</label>
                        <Textarea ref="textareaRef" v-model="localValue" rows="8" class="w-full !font-mono !text-sm" autoResize />
                    </div>
                    <div class="flex flex-col gap-1">
                        <label class="text-xs font-semibold text-surface-600 dark:text-surface-300">Preview</label>
                        <div class="border border-surface-300 dark:border-surface-600 rounded p-3 min-h-[200px] bg-surface-50 dark:bg-surface-900 overflow-auto" v-html="previewHtml"></div>
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
                <InputGroup><InputGroupAddon>User</InputGroupAddon><AutoComplete v-model="tempRefParams.user" :suggestions="userSuggestions" @complete="searchUser" class="w-full" /></InputGroup>
                <InputGroup><InputGroupAddon>Date</InputGroupAddon><InputText v-model="tempRefParams.date" /></InputGroup>
                <InputGroup><InputGroupAddon>Comment</InputGroupAddon><InputText v-model="tempRefParams.comment" /></InputGroup>
            </div>
            <div v-if="currentRefType === 'Refurl'" class="flex flex-col gap-2">
                 <InputGroup><InputGroupAddon>URL</InputGroupAddon><InputText v-model="tempRefParams.url" /></InputGroup>
                 <InputGroup><InputGroupAddon>Title</InputGroupAddon><InputText v-model="tempRefParams.title" /></InputGroup>
                 <InputGroup><InputGroupAddon>Date</InputGroupAddon><InputText v-model="tempRefParams.date" /></InputGroup>
                 <InputGroup><InputGroupAddon>Snippet</InputGroupAddon><InputText v-model="tempRefParams.snippet" /></InputGroup>
            </div>
            <div v-if="currentRefType === 'cn'" class="flex flex-col gap-2">
                 <InputGroup><InputGroupAddon>Date</InputGroupAddon><InputText v-model="tempRefParams.date" /></InputGroup>
                 <InputGroup><InputGroupAddon>Reason</InputGroupAddon><InputText v-model="tempRefParams.reason" /></InputGroup>
            </div>
            <div class="flex justify-end gap-2">
                <Button label="Cancel" text @click="showRefParamDialog = false" />
                <Button label="Insert" @click="insertReferenceToNote" />
            </div>
        </div>
    </Dialog>
</template>
