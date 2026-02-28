<script setup lang="ts">
import { ref, watch, computed } from 'vue';

defineOptions({
    inheritAttrs: false
});
import Editor from 'primevue/editor';
import Dialog from 'primevue/dialog';
import InputGroup from 'primevue/inputgroup';
import InputGroupAddon from 'primevue/inputgroupaddon';
import InputText from 'primevue/inputtext';
import AutoComplete from 'primevue/autocomplete';
import Button from 'primevue/button';
import Checkbox from 'primevue/checkbox';
import Textarea from 'primevue/textarea';
import {
    ListChecks, Link2, MessageSquareWarning,
    Keyboard, FileText, Globe, User, Puzzle, Code, X, Wrench
} from 'lucide-vue-next';
import { wikitextToHtml, htmlToWikitext } from '../../utils/htmlWikitextConverter';
import { useReferences } from '../../composables/useReferences';
import { pcgwApi } from '../../services/pcgwApi';
import { useDebounceFn } from '@vueuse/core';
import CodeEditor from '../CodeEditor.vue';
import Quill from 'quill';

const BlockEmbed = Quill.import('blots/block/embed') as any;

class FixboxBlot extends BlockEmbed {
    static blotName = 'fixbox';
    static tagName = 'div';
    static className = 'fixbox-wrapper';

    static create(value: any) {
        const node = super.create() as HTMLElement;
        if (typeof value === 'string') {
            node.innerHTML = value;
        } else if (value && value.html) {
            node.innerHTML = value.html;
        }
        node.setAttribute('contenteditable', 'false');

        // Extract data-wikitext to preserve it in the node if passed
        const match = node.innerHTML.match(/data-wikitext="([^"]+)"/);
        if (match) {
            node.setAttribute('data-wikitext', match[1]);
        }
        return node;
    }

    static value(node: HTMLElement) {
        return {
            html: node.innerHTML
        };
    }
}

Quill.register(FixboxBlot, true);

const props = defineProps<{
    modelValue: string;
    placeholder?: string;
    editorStyle?: string;
    readonly?: boolean;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const htmlValue = ref('');
const previousWikitext = ref('');
const editorRef = ref<any>(null);

const showSource = ref(false);

const localWikitext = computed({
    get: () => props.modelValue || '',
    set: (val) => {
        emit('update:modelValue', val);
        previousWikitext.value = val;
        htmlValue.value = wikitextToHtml(val);
    }
});

watch(() => props.modelValue, (newVal) => {
    if (newVal !== previousWikitext.value) {
        htmlValue.value = wikitextToHtml(newVal || '');
        previousWikitext.value = newVal || '';
    }
}, { immediate: true });

const onTextChange = (e: any) => {
    if (e.source === 'user') {
        const wikitext = htmlToWikitext(e.htmlValue);
        previousWikitext.value = wikitext;
        emit('update:modelValue', wikitext);
    }
};

const { cleanParams } = useReferences();

const showRefParamDialog = ref(false);
const currentRefType = ref<'Refcheck' | 'Refurl' | 'cn' | 'key' | 'ilink' | 'wlink' | 'ulink' | 'tlink'>('Refcheck');
const tempRefParams = ref<Record<string, string>>({});

const showFixboxDialog = ref(false);
const tempFixboxParams = ref({
    description: '',
    ref: '',
    collapsed: false,
    fix: ''
});
const oldFixboxParams = ref({
    description: '',
    ref: '',
    collapsed: false,
    fix: ''
});
const editingFixboxWikitext = ref<string | null>(null);

const openFixboxDialog = () => {
    tempFixboxParams.value = { description: '', ref: '', collapsed: false, fix: '' };
    oldFixboxParams.value = { description: '', ref: '', collapsed: false, fix: '' };
    editingFixboxWikitext.value = null;
    showFixboxDialog.value = true;
};

const insertFixbox = () => {
    let template = `{{Fixbox|description=${tempFixboxParams.value.description}`;
    if (tempFixboxParams.value.ref) {
        template += `|ref=${tempFixboxParams.value.ref}`;
    }
    if (tempFixboxParams.value.collapsed) {
        template += `|collapsed=yes`;
    }
    if (tempFixboxParams.value.fix) {
        template += `|fix=\n${tempFixboxParams.value.fix}\n`;
    }
    template += `}}`;

    // If we're editing an existing fixbox, replace it in the underlying wikitext directly
    if (editingFixboxWikitext.value) {
        if (localWikitext.value.includes(editingFixboxWikitext.value)) {
            localWikitext.value = localWikitext.value.replace(editingFixboxWikitext.value, template);
        } else {
            // Fuzzy match by description if whitespace normalization caused the split
            let escapedDesc = oldFixboxParams.value.description.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Prevent greedy bleeding between adjacent Fixboxes by ensuring we do not cross `}}`
            const innerMatch = '(?:(?!\\}\\})[\\s\\S])*?';
            const regexStr = escapedDesc
                ? `\\{\\{Fixbox\\s*\\|${innerMatch}(?:description\\s*=\\s*)?${escapedDesc}${innerMatch}\\}\\}`
                : `\\{\\{Fixbox\\s*\\|${innerMatch}\\}\\}`;
            const fallbackRegex = new RegExp(regexStr, 'i');

            if (fallbackRegex.test(localWikitext.value)) {
                localWikitext.value = localWikitext.value.replace(fallbackRegex, template);
            } else {
                localWikitext.value = localWikitext.value + '\n\n' + template;
            }
        }

        editingFixboxWikitext.value = null;
        showFixboxDialog.value = false;
        return;
    }

    if (!showSource.value) {
        // Insert as rendered HTML directly into quill so it shows up as a table!
        const quill = editorRef.value?.quill;
        if (quill) {
            const range = quill.getSelection(true) || { index: quill.getLength() };
            const renderedHtml = wikitextToHtml(template);

            // To properly insert our custom block embed, extract its innerHTML minus the enclosing div
            const divRegex = /<div class="fixbox-wrapper"[^>]*>([\s\S]*?)<\/div>/i;
            const contentMatch = renderedHtml.match(divRegex);
            const innerContent = contentMatch ? contentMatch[1] : renderedHtml;

            quill.insertEmbed(range.index, 'fixbox', { html: innerContent }, 'user');
            // Insert newline after to escape the block
            quill.insertText(range.index + 1, '\n', 'user');
            quill.setSelection(range.index + 2);
        } else {
            htmlValue.value += "\n" + wikitextToHtml(template) + "\n";
            localWikitext.value = htmlToWikitext(htmlValue.value);
        }
    } else {
        localWikitext.value = localWikitext.value + (localWikitext.value ? '\n\n' : '') + template + '\n';
    }
    showFixboxDialog.value = false;
};

const onEditorContentClick = (event: MouseEvent) => {
    if (showSource.value) return;
    const target = event.target as HTMLElement;
    const fixbox = target.closest('.fixbox-wrapper') as HTMLElement;

    if (fixbox) {
        // Compute the wikitext corresponding to exactly this HTML node
        const wikitext = htmlToWikitext(fixbox.outerHTML).trim();
        if (!wikitext) return;

        editingFixboxWikitext.value = wikitext;

        let description = '';
        let refStr = '';
        let fix = '';
        let collapsed = false;

        const contentMatch = wikitext.match(/\{\{Fixbox\s*\|([\s\S]+)\}\}/i);
        if (contentMatch) {
            const parts = contentMatch[1].split(/\|(?=\w+=)/);
            for (const part of parts) {
                const eqIndex = part.indexOf('=');
                if (eqIndex > -1) {
                    const key = part.substring(0, eqIndex).trim();
                    const val = part.substring(eqIndex + 1).trim();
                    if (key === 'description') description = val;
                    else if (key === 'ref') {
                        // Extract inner text cleanly if it's wrapped in <ref>
                        const innerRefMatch = val.match(/^<ref>([\s\S]*)<\/ref>$/i);
                        refStr = innerRefMatch ? innerRefMatch[1] : val;
                    }
                    else if (key === 'collapsed') collapsed = val.toLowerCase() === 'yes';
                    else if (key === 'fix') fix = val;
                } else if (part.trim() && !description) {
                    description = part.trim();
                }
            }
        }

        tempFixboxParams.value = {
            description,
            ref: refStr,
            collapsed,
            fix: fix.trim()
        };
        oldFixboxParams.value = { ...tempFixboxParams.value };
        showFixboxDialog.value = true;
    }
};

const userSuggestions = ref<string[]>([]);

const searchUser = useDebounceFn(async (event: { query: string }) => {
    userSuggestions.value = await pcgwApi.searchUsers(event.query);
}, 300);

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

const onEditorLoad = (e: any) => {
    // PrimeVue's Editor instance
    const quill = e.instance;
    if (quill && quill.root) {
        quill.root.addEventListener('click', onEditorContentClick);
    }
};

const insertReference = () => {
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

    if (!showSource.value) {
        const quill = editorRef.value?.quill;
        if (quill) {
            const range = quill.getSelection(true);
            quill.insertText(range.index, " " + template, 'user');
            quill.setSelection(range.index + template.length + 1);
        } else {
            htmlValue.value += " " + template;
            localWikitext.value = htmlToWikitext(htmlValue.value);
        }
    } else {
        localWikitext.value = localWikitext.value + (localWikitext.value ? ' ' : '') + template;
    }
    showRefParamDialog.value = false;
};

defineExpose({
    insertText: (text: string) => {
        if (!showSource.value) {
            const quill = editorRef.value?.quill;
            if (quill) {
                const range = quill.getSelection(true);
                quill.insertText(range.index, text, 'user');
                quill.setSelection(range.index + text.length);
            } else {
                htmlValue.value += text;
                localWikitext.value = htmlToWikitext(htmlValue.value);
            }
        } else {
            localWikitext.value += text;
        }
    }
});
</script>

<template>
    <div class="wysiwyg-editor-container flex flex-col gap-2 relative" v-bind="$attrs">
        <Transition name="fade" mode="out-in">
            <div v-if="!showSource" class="w-full">
                <Editor ref="editorRef" v-model="htmlValue" :editorStyle="editorStyle || 'height: 250px'"
                    :placeholder="placeholder" :readonly="readonly" @text-change="onTextChange" @load="onEditorLoad">
                    <template #toolbar>
                        <div
                            class="flex flex-col sm:flex-row w-full justify-between gap-2 overflow-hidden items-start sm:items-center">
                            <div class="flex flex-wrap items-center">
                                <span class="ql-formats">
                                    <button class="ql-bold" v-tooltip.bottom="'Bold'"></button>
                                    <button class="ql-italic" v-tooltip.bottom="'Italic'"></button>
                                    <button class="ql-underline" v-tooltip.bottom="'Underline'"></button>
                                    <button class="ql-strike" v-tooltip.bottom="'Strikethrough'"></button>
                                </span>
                                <span class="ql-formats">
                                    <select class="ql-header" defaultValue="0" v-tooltip.bottom="'Heading'">
                                        <option value="2">Heading 2</option>
                                        <option value="3">Heading 3</option>
                                        <option value="4">Heading 4</option>
                                        <option value="5">Heading 5</option>
                                        <option value="6">Heading 6</option>
                                        <option value="false" selected>Normal</option>
                                    </select>
                                </span>
                                <span class="ql-formats">
                                    <button class="ql-link" v-tooltip.bottom="'Link'"></button>
                                    <button class="ql-code-block" v-tooltip.bottom="'Code'"></button>
                                    <button class="ql-blockquote" v-tooltip.bottom="'Blockquote'"></button>
                                </span>
                                <span class="ql-formats">
                                    <button class="ql-list" value="ordered" v-tooltip.bottom="'Ordered List'"></button>
                                    <button class="ql-list" value="bullet" v-tooltip.bottom="'Bullet List'"></button>
                                </span>
                                <span class="ql-formats">
                                    <button class="ql-clean" v-tooltip.bottom="'Remove Formatting'"></button>
                                </span>

                                <!-- Snippet Tools -->
                                <span
                                    class="ql-formats lg:ml-2 lg:pl-2 lg:border-l border-surface-200 dark:border-surface-700 mt-2 sm:mt-0">
                                    <button type="button" v-tooltip.top="'Refcheck'" class="custom-action-btn"
                                        @click="openRefParamDialog('Refcheck')">
                                        <ListChecks class="w-4 h-4" />
                                    </button>
                                    <button type="button" v-tooltip.top="'Refurl'" class="custom-action-btn"
                                        @click="openRefParamDialog('Refurl')">
                                        <Link2 class="w-4 h-4" />
                                    </button>
                                    <button type="button" v-tooltip.top="'Citation'" class="custom-action-btn"
                                        @click="openRefParamDialog('cn')">
                                        <MessageSquareWarning class="w-4 h-4" />
                                    </button>
                                    <div class="hidden xl:block w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1"></div>
                                    <button type="button" v-tooltip.top="'Key'" class="custom-action-btn"
                                        @click="openRefParamDialog('key')">
                                        <Keyboard class="w-4 h-4" />
                                    </button>
                                    <button type="button" v-tooltip.top="'Page Link'" class="custom-action-btn"
                                        @click="openRefParamDialog('ilink')">
                                        <FileText class="w-4 h-4" />
                                    </button>
                                    <button type="button" v-tooltip.top="'Wiki Link'" class="custom-action-btn"
                                        @click="openRefParamDialog('wlink')">
                                        <Globe class="w-4 h-4" />
                                    </button>
                                    <button type="button" v-tooltip.top="'User'" class="custom-action-btn"
                                        @click="openRefParamDialog('ulink')">
                                        <User class="w-4 h-4" />
                                    </button>
                                    <button type="button" v-tooltip.top="'Template'" class="custom-action-btn"
                                        @click="openRefParamDialog('tlink')">
                                        <Puzzle class="w-4 h-4" />
                                    </button>
                                    <div class="hidden xl:block w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1"></div>
                                    <button type="button" v-tooltip.top="'Fixbox'" class="custom-action-btn"
                                        @click="openFixboxDialog()">
                                        <Wrench class="w-4 h-4 text-orange-500" />
                                    </button>
                                </span>
                                <!-- Custom extra toolbar items -->
                                <slot name="custom-toolbar"></slot>
                            </div>

                            <div
                                class="flex items-center lg:border-l border-surface-200 dark:border-surface-700 lg:pl-2 ml-auto">
                                <button type="button" v-tooltip.top="'Source Mode'"
                                    class="custom-action-btn !text-primary-500 hover:!bg-primary-50 dark:hover:!bg-primary-900/20"
                                    @click="showSource = !showSource">
                                    <Code class="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    </template>
                </Editor>
            </div>

            <!-- Advanced Source Editor -->
            <div v-else
                class="flex flex-col border border-surface-200 dark:border-surface-700 rounded overflow-hidden w-full">
                <div
                    class="flex items-center justify-between bg-surface-50 dark:bg-surface-800 p-2 border-b border-surface-200 dark:border-surface-700">
                    <span class="text-xs font-semibold text-surface-600 dark:text-surface-300 ml-2">Wikitext Source
                        Editor</span>
                    <button type="button" v-tooltip.left="'Exit Source Mode'" class="custom-action-btn !ml-auto"
                        @click="showSource = false">
                        <X class="w-4 h-4" />
                    </button>
                </div>

                <!-- Keep snippet tools accessible in Source Mode too! -->
                <div
                    class="flex flex-wrap items-center gap-1 bg-surface-50 dark:bg-surface-800 p-2 border-b border-surface-200 dark:border-surface-700">
                    <button type="button" v-tooltip.top="'Refcheck'" class="custom-action-btn"
                        @click="openRefParamDialog('Refcheck')">
                        <ListChecks class="w-4 h-4" />
                    </button>
                    <button type="button" v-tooltip.top="'Refurl'" class="custom-action-btn"
                        @click="openRefParamDialog('Refurl')">
                        <Link2 class="w-4 h-4" />
                    </button>
                    <button type="button" v-tooltip.top="'Citation'" class="custom-action-btn"
                        @click="openRefParamDialog('cn')">
                        <MessageSquareWarning class="w-4 h-4" />
                    </button>
                    <button type="button" v-tooltip.top="'Key'" class="custom-action-btn"
                        @click="openRefParamDialog('key')">
                        <Keyboard class="w-4 h-4" />
                    </button>
                    <button type="button" v-tooltip.top="'Page Link'" class="custom-action-btn"
                        @click="openRefParamDialog('ilink')">
                        <FileText class="w-4 h-4" />
                    </button>
                    <button type="button" v-tooltip.top="'Wiki Link'" class="custom-action-btn"
                        @click="openRefParamDialog('wlink')">
                        <Globe class="w-4 h-4" />
                    </button>
                    <button type="button" v-tooltip.top="'Template'" class="custom-action-btn"
                        @click="openRefParamDialog('tlink')">
                        <Puzzle class="w-4 h-4" />
                    </button>
                    <div class="hidden xl:block w-px h-4 bg-surface-200 dark:bg-surface-700 mx-1"></div>
                    <button type="button" v-tooltip.top="'Fixbox'" class="custom-action-btn"
                        @click="openFixboxDialog()">
                        <Wrench class="w-4 h-4 text-orange-500" />
                    </button>
                </div>
                <!-- The actual CodeMirror Editor -->
                <CodeEditor v-model="localWikitext" :style="editorStyle || 'height: 250px'" />
            </div>
        </Transition>
    </div>

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
            <div class="flex justify-end gap-2 mt-4 inline-flex w-full">
                <Button label="Cancel" text @click="showRefParamDialog = false" class="ml-auto" />
                <Button label="Insert" @click="insertReference" />
            </div>
        </div>
    </Dialog>

    <!-- Sub-dialog for Fixbox insertion -->
    <Dialog v-model:visible="showFixboxDialog" header="Insert Fixbox" modal class="w-full max-w-lg">
        <div class="flex flex-col gap-4">
            <InputGroup>
                <InputGroupAddon>Name/Description</InputGroupAddon>
                <InputText v-model="tempFixboxParams.description" placeholder="Short description or name of the fix" />
            </InputGroup>

            <InputGroup>
                <InputGroupAddon>Reference (Optional)</InputGroupAddon>
                <InputText v-model="tempFixboxParams.ref" placeholder="<ref>Reference text</ref>" />
            </InputGroup>

            <div class="flex items-center gap-2 mt-2">
                <Checkbox v-model="tempFixboxParams.collapsed" inputId="fixboxCollapsed" :binary="true" />
                <label for="fixboxCollapsed" class="text-sm cursor-pointer select-none">Make fixbox collapsible /
                    collapsed
                    by default?</label>
            </div>

            <div class="flex flex-col gap-2 mt-2">
                <label class="text-sm font-semibold text-surface-600 dark:text-surface-300">Instructions
                    (Optional)</label>
                <Textarea v-model="tempFixboxParams.fix" rows="4"
                    placeholder="Detailed instructions to apply this fix... Leave empty for a one-line fixbox."
                    class="w-full" />
            </div>

            <div class="flex justify-end gap-2 mt-4 inline-flex w-full">
                <Button label="Cancel" text @click="showFixboxDialog = false" class="ml-auto" />
                <Button :label="editingFixboxWikitext ? 'Update Fixbox' : 'Insert Fixbox'" @click="insertFixbox" />
            </div>
        </div>
    </Dialog>
</template>

<style>
/* Adjust toolbar to fit smaller spaces seamlessly */
.wysiwyg-editor-container .p-editor-toolbar {
    padding: 0.25rem 0.5rem;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
}

/* Ensure ql-formats wrap correctly without awkward gaps */
.wysiwyg-editor-container .p-editor-toolbar .ql-formats {
    display: inline-flex;
    flex-wrap: wrap;
    align-items: center;
    margin-right: 0 !important;
}

.custom-action-btn {
    width: 28px !important;
    height: 28px !important;
    padding: 0 !important;
    border: none !important;
    background: transparent !important;
    border-radius: 6px !important;
    color: var(--p-surface-500) !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    transition: background-color 0.2s, color 0.2s;
    float: none !important;
    cursor: pointer;
}

.dark .custom-action-btn {
    color: var(--p-surface-400) !important;
}

.custom-action-btn:hover {
    background-color: var(--p-surface-200) !important;
    color: var(--p-surface-800) !important;
}

.dark .custom-action-btn:hover {
    background-color: var(--p-surface-700) !important;
    color: var(--p-surface-100) !important;
}

.custom-action-btn svg {
    width: 16px !important;
    height: 16px !important;
    float: none !important;
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
}

.ql-editor ol li[data-list='bullet']::before {
    content: '\2022';
}
</style>
