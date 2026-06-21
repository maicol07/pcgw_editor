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
import { VueDraggable } from 'vue-draggable-plus';

import {
    ListChecks, Link2, MessageSquareWarning,
    Code, X,
    BookOpen, GripVertical, Plus, Info
} from 'lucide-vue-next';
import { wikitextToHtml, htmlToWikitext } from '../../utils/htmlWikitextConverter';
import { useReferences } from '../../composables/useReferences';
import { pcgwApi } from '../../services/pcgwApi';
import { useDebounceFn } from '@vueuse/core';
import CodeEditor from '../CodeEditor.vue';
import EditorSnippetTools, { type SnippetAction } from './EditorSnippetTools.vue';
import Quill from 'quill';
import { renderInlineToken, renderMmList, splitArgs } from '../../utils/wikiRender';
import { KEYBOARD_GROUPS } from '../../constants/keyboardKeys';

const BlockEmbed = Quill.import('blots/block/embed') as any;
const InlineEmbed = Quill.import('blots/embed') as any;

// Extract the inner markup of the first wrapper <div class="cls" ...>…</div> from rendered HTML
const innerOfWrapper = (html: string, cls: string): string => {
    const m = html.match(new RegExp(`<div class="${cls}"[^>]*>([\\s\\S]*)</div>`, 'i'));
    return m ? m[1] : html;
};

// All three embeds store their verbatim wikitext in data-wikitext and render their visual
// from it, so they round-trip losslessly (see htmlToWikitext) and stay editable via dialog.

class FixboxBlot extends BlockEmbed {
    static blotName = 'fixbox';
    static tagName = 'div';
    static className = 'fixbox-wrapper';

    static create(value: any) {
        const node = super.create() as HTMLElement;
        const wt = typeof value === 'string' ? value : (value?.wikitext ?? '');
        if (wt) {
            node.innerHTML = innerOfWrapper(wikitextToHtml(wt), 'fixbox-wrapper');
            node.setAttribute('data-wikitext', encodeURIComponent(wt));
        } else if (value?.html) {
            // Back-compat with previously pre-rendered html payloads
            node.innerHTML = value.html;
            const m = node.innerHTML.match(/data-wikitext="([^"]+)"/);
            if (m) node.setAttribute('data-wikitext', m[1]);
        }
        node.setAttribute('contenteditable', 'false');
        return node;
    }

    static value(node: HTMLElement) {
        const dw = node.getAttribute('data-wikitext');
        return dw ? { wikitext: decodeURIComponent(dw) } : { html: node.innerHTML };
    }
}

class MmListBlot extends BlockEmbed {
    static blotName = 'wikimm';
    static tagName = 'div';
    static className = 'wiki-mm';

    static create(value: any) {
        const node = super.create() as HTMLElement;
        const wt = typeof value === 'string' ? value : (value?.wikitext ?? '');
        node.innerHTML = `<dl>${renderMmList(wt)}</dl>`;
        node.setAttribute('data-wikitext', encodeURIComponent(wt));
        node.setAttribute('contenteditable', 'false');
        return node;
    }

    static value(node: HTMLElement) {
        return { wikitext: decodeURIComponent(node.getAttribute('data-wikitext') || '') };
    }
}

class WikiTokenBlot extends InlineEmbed {
    static blotName = 'wikitoken';
    static tagName = 'span';
    static className = 'wiki-token';

    static create(value: any) {
        const node = super.create() as HTMLElement;
        const wt = typeof value === 'string' ? value : (value?.wikitext ?? '');
        node.innerHTML = renderInlineToken(wt) ?? wt;
        node.setAttribute('data-wikitext', encodeURIComponent(wt));
        node.setAttribute('contenteditable', 'false');
        return node;
    }

    static value(node: HTMLElement) {
        return { wikitext: decodeURIComponent(node.getAttribute('data-wikitext') || '') };
    }
}

Quill.register(FixboxBlot, true);
Quill.register(MmListBlot, true);
Quill.register(WikiTokenBlot, true);

const props = defineProps<{
    modelValue: string;
    placeholder?: string;
    editorStyle?: string;
    readonly?: boolean;
    label?: string;
    description?: string;
    icon?: any;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: string): void;
}>();

const htmlValue = ref('');
const previousWikitext = ref('');
const editorRef = ref<any>(null);

const showSource = ref(false);

// Live word/char count from the active source (plain text in WYSIWYG, raw wikitext in Source).
const stats = computed(() => {
    const text = showSource.value
        ? (props.modelValue || '')
        : (htmlValue.value || '').replace(/<[^>]*>/g, ' ').replace(/&[a-z]+;/gi, ' ');
    const words = (text.trim().match(/\S+/g) || []).length;
    return { words, chars: text.trim().length };
});

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
type ReferenceType = 'Refcheck' | 'Refurl' | 'cn' | 'key' | 'ilink' | 'wlink' | 'ulink' | 'tlink';
const currentRefType = ref<ReferenceType>('Refcheck');
const tempRefParams = ref<Record<string, string>>({});
// State for keyboard keys
const selectedKeys = ref<string[]>([]);
const customKey = ref('');

const addCustomKey = () => {
    if (customKey.value.trim()) {
        selectedKeys.value.push(customKey.value.trim());
        customKey.value = '';
    }
};

const addStandardKey = (val: string) => {
    selectedKeys.value.push(val);
};

const getKeyLabel = (val: string) => {
    for (const group of KEYBOARD_GROUPS) {
        const item = group.items.find(i => i.value === val);
        if (item) return item.label;
    }
    return val;
};

const removeKey = (index: number) => {
    selectedKeys.value.splice(index, 1);
};

const wrapInRef = ref(true);
const citationTarget = ref<'editor' | 'fixbox'>('editor');

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
// When set, the reference dialog is editing this existing inline-token embed in place.
const editingTokenNode = ref<HTMLElement | null>(null);
// When true, the reference dialog is editing a Fixbox's existing reference (not the editor).
const editingExistingFixboxRef = ref(false);

type RefFields = { type: ReferenceType; params?: Record<string, string>; keys?: string[]; wrap: boolean };

// Parse a reference/link/token wikitext back into the matching dialog field values.
const parseRefToFields = (wt: string): RefFields | null => {
    let body = wt.trim();
    let wrap = false;
    const refM = body.match(/^<ref(?:\s+name="[^"]*")?>([\s\S]*?)<\/ref>$/i);
    if (refM) { wrap = true; body = refM[1].trim(); }

    let m = body.match(/^\[\[\s*w\s*\|\s*([^|\]]+?)\s*\]\]$/i);
    if (m) return { type: 'wlink', params: { page: m[1].trim(), text: '' }, wrap: false };
    m = body.match(/^\[\[\s*Wikipedia\s*:\s*([^|\]]+?)\s*(?:\|\s*([^\]]*?))?\s*\]\]$/i);
    if (m) return { type: 'wlink', params: { page: m[1].trim(), text: (m[2] || '').trim() }, wrap: false };

    const tplM = body.match(/^\{\{\s*([A-Za-z]+)\s*(?:\|([\s\S]*))?\}\}$/);
    if (!tplM) return null;
    const name = tplM[1].toLowerCase();
    const params: Record<string, string> = {};
    const positional: string[] = [];
    for (const a of splitArgs(tplM[2] || '')) {
        const eq = a.indexOf('=');
        if (eq > -1 && !/[{[]/.test(a.slice(0, eq))) params[a.slice(0, eq).trim().toLowerCase()] = a.slice(eq + 1).trim();
        else if (a.trim()) positional.push(a.trim());
    }

    if (name === 'key') return { type: 'key', keys: positional, wrap };
    if (name === 'u') return { type: 'ulink', params: { user: positional[0] || '', id: positional[1] || '' }, wrap };
    if (name === 't') return { type: 'tlink', params: { template: positional[0] || '' }, wrap };
    if (name === 'refcheck') return { type: 'Refcheck', params: { user: params.user || '', date: params.date || '', comment: params.comment || '' }, wrap };
    if (name === 'refurl') return { type: 'Refurl', params: { url: params.url || '', title: params.title || '', date: params.date || '', snippet: params.snippet || '' }, wrap };
    if (name === 'cn') return { type: 'cn', params: { date: params.date || '', reason: params.reason || '' }, wrap };
    return null;
};

const applyRefFields = (f: RefFields) => {
    currentRefType.value = f.type;
    wrapInRef.value = f.wrap;
    if (f.type === 'key') selectedKeys.value = f.keys || [];
    else tempRefParams.value = { ...(f.params || {}) };
};

// Parse a clicked inline-token's wikitext back into the matching dialog fields.
const openTokenForEdit = (wt: string, node: HTMLElement) => {
    const f = parseRefToFields(wt);
    if (!f) return;
    editingExistingFixboxRef.value = false;
    editingTokenNode.value = node;
    applyRefFields(f);
    showRefParamDialog.value = true;
};

const refDialogHeader = computed(() =>
    ((editingTokenNode.value || editingExistingFixboxRef.value) ? 'Edit ' : 'Insert ') + currentRefType.value);
const fixboxDialogHeader = computed(() => editingFixboxWikitext.value ? 'Edit Fixbox' : 'Insert Fixbox');

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
            quill.insertEmbed(range.index, 'fixbox', { wikitext: template }, 'user');
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

    // Clicks on rendered embeds open their editor / are inert — never follow inner links
    if (target.closest('.wiki-token, .wiki-mm, .fixbox-wrapper')) {
        event.preventDefault();
    }

    const token = target.closest('.wiki-token') as HTMLElement;
    if (token) {
        const wt = decodeURIComponent(token.getAttribute('data-wikitext') || '');
        if (wt) openTokenForEdit(wt, token);
        return;
    }

    const fixbox = target.closest('.fixbox-wrapper') as HTMLElement;

    if (fixbox) {
        // The wikitext is stored verbatim on the embed; fall back to re-parsing the table HTML
        const dw = fixbox.getAttribute('data-wikitext');
        const wikitext = (dw ? decodeURIComponent(dw) : htmlToWikitext(fixbox.outerHTML)).trim();
        if (!wikitext) return;

        editingFixboxWikitext.value = wikitext;

        let description = '';
        let refStr = '';
        let fix = '';
        let collapsed = false;

        // Balanced split so a nested ref template ({{Refcheck|user=…|date=…}}) isn't torn apart
        const inner = wikitext.replace(/^\{\{\s*Fixbox\s*\|/i, '').replace(/\}\}$/, '');
        for (const part of splitArgs(inner)) {
            const eq = part.indexOf('=');
            if (eq > -1 && !/[{[]/.test(part.slice(0, eq))) {
                const key = part.slice(0, eq).trim();
                const val = part.slice(eq + 1).trim();
                if (key === 'description') description = val;
                else if (key === 'ref') refStr = val; // keep <ref> wrapper so type/wrap parse correctly
                else if (key === 'collapsed') collapsed = val.toLowerCase() === 'yes';
                else if (key === 'fix') fix = val;
            } else if (part.trim() && !description) {
                description = part.trim();
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

const openRefParamDialog = (type: ReferenceType, target: 'editor' | 'fixbox' = 'editor') => {
    currentRefType.value = type;
    citationTarget.value = target;
    editingTokenNode.value = null;
    editingExistingFixboxRef.value = false;
    const today = new Date().toISOString().split('T')[0];
    const params: Record<string, string> = {};

    // Default wrapInRef to true for citation types
    wrapInRef.value = ['Refcheck', 'Refurl', 'cn'].includes(type);

    if (type === 'Refcheck') { params.date = today; params.user = 'User'; }
    if (type === 'Refurl') { params.date = today; params.url = ''; params.title = ''; }
    if (type === 'cn') { params.date = today; }

    if (type === 'ilink') { params.page = ''; params.text = ''; }
    if (type === 'wlink') { params.page = ''; params.text = ''; }
    if (type === 'ulink') { params.user = ''; params.id = ''; }
    if (type === 'tlink') { params.template = ''; }
    if (type === 'key') {
        selectedKeys.value = [];
    }

    tempRefParams.value = params;

    // Editing a Fixbox that already has a reference of this type: pre-fill from it
    if (target === 'fixbox' && tempFixboxParams.value.ref) {
        const f = parseRefToFields(tempFixboxParams.value.ref);
        if (f && f.type === type) {
            applyRefFields(f);
            editingExistingFixboxRef.value = true;
        }
    }

    showRefParamDialog.value = true;
};

const onSnippetAction = (p: SnippetAction) => {
    if (p.kind === 'fixbox') openFixboxDialog();
    else openRefParamDialog(p.type as ReferenceType);
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
        const keys = selectedKeys.value.map(k => k.trim()).filter(Boolean);
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
        
        // Wrap in <ref> if selected for citation types
        if (wrapInRef.value && ['Refcheck', 'Refurl', 'cn'].includes(currentRefType.value)) {
            template = `<ref>${template}</ref>`;
        }
    }

    if (!template) {
        showRefParamDialog.value = false;
        return;
    }

    if (citationTarget.value === 'fixbox') {
        tempFixboxParams.value.ref = template;
        showRefParamDialog.value = false;
        citationTarget.value = 'editor';
        editingExistingFixboxRef.value = false;
        return;
    }

    if (showSource.value) {
        localWikitext.value = localWikitext.value + (localWikitext.value ? ' ' : '') + template;
        editingTokenNode.value = null;
        showRefParamDialog.value = false;
        return;
    }

    const quill = editorRef.value?.quill;
    if (!quill) {
        htmlValue.value += " " + template;
        localWikitext.value = htmlToWikitext(htmlValue.value);
        editingTokenNode.value = null;
        showRefParamDialog.value = false;
        return;
    }

    // ilink stays a normal editable link; everything else is an atomic rendered chip
    const insertAt = (index: number) => {
        if (currentRefType.value === 'ilink') {
            const text = params.text || params.page;
            quill.insertText(index, text, { link: params.page }, 'user');
            quill.setSelection(index + text.length, 0);
        } else {
            quill.insertEmbed(index, 'wikitoken', { wikitext: template }, 'user');
            quill.setSelection(index + 1, 0);
        }
    };

    // Editing an existing chip: replace it in place
    const node = editingTokenNode.value;
    editingTokenNode.value = null;
    if (node) {
        const blot = Quill.find(node);
        if (blot) {
            const index = quill.getIndex(blot as any);
            quill.deleteText(index, 1, 'user');
            insertAt(index);
            showRefParamDialog.value = false;
            return;
        }
    }

    const range = quill.getSelection(true) || { index: quill.getLength() };
    insertAt(range.index);
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
    <div class="wysiwyg-editor-container flex flex-col relative border border-surface-200 dark:border-surface-700 rounded-lg overflow-hidden bg-surface-0 dark:bg-surface-900" v-bind="$attrs">
        <!-- Header: title · description · source toggle -->
        <div class="wysiwyg-header sticky top-0 z-20 flex items-center justify-between gap-2 px-3 py-2 border-b border-surface-200 dark:border-surface-700 bg-surface-50/90 dark:bg-surface-800/80 backdrop-blur">
            <div class="flex items-center gap-2 min-w-0">
                <component :is="icon" class="w-4 h-4 text-primary-500 shrink-0" v-if="icon" />
                <span v-if="label" class="text-sm font-semibold text-surface-700 dark:text-surface-200 truncate">{{ label }}</span>
                <span v-if="description" v-tooltip.top="description"
                    class="text-surface-400 hover:text-primary-500 cursor-help shrink-0">
                    <Info class="w-4 h-4" />
                </span>
            </div>
            <button type="button" v-tooltip.top="showSource ? 'Exit source mode' : 'Source mode'"
                class="custom-action-btn shrink-0"
                :class="showSource ? 'text-primary-600! bg-primary-100! dark:bg-primary-900/30!' : 'text-primary-500! hover:bg-primary-50! dark:hover:bg-primary-900/20!'"
                @click="showSource = !showSource">
                <Code class="w-4 h-4" />
            </button>
        </div>

        <Transition name="fade" mode="out-in">
            <div v-if="!showSource" class="w-full">
                <Editor ref="editorRef" v-model="htmlValue" :editorStyle="editorStyle || 'height: 250px'"
                    :placeholder="placeholder" :readonly="readonly" @text-change="onTextChange" @load="onEditorLoad">
                    <template #toolbar>
                        <div
                            class="flex flex-col sm:flex-row w-full justify-between gap-2 items-start sm:items-center">
                            <div class="flex flex-wrap items-center">
                                <span class="ql-formats">
                                    <button class="ql-bold" v-tooltip.bottom="'Bold'"></button>
                                    <button class="ql-italic" v-tooltip.bottom="'Italic'"></button>
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
                                    <button class="ql-code" v-tooltip.bottom="'Code'"></button>
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
                                    <EditorSnippetTools @action="onSnippetAction" />
                                </span>
                                <!-- Custom extra toolbar items -->
                                <slot name="custom-toolbar"></slot>
                            </div>
                        </div>
                    </template>
                </Editor>
            </div>

            <!-- Advanced Source Editor -->
            <div v-else class="flex flex-col w-full">
                <!-- Keep snippet tools accessible in Source Mode too! -->
                <div
                    class="flex flex-wrap items-center gap-1 bg-surface-50 dark:bg-surface-800 p-2 border-b border-surface-200 dark:border-surface-700">
                    <EditorSnippetTools @action="onSnippetAction" />
                </div>
                <!-- The actual CodeMirror Editor -->
                <CodeEditor v-model="localWikitext" :style="editorStyle || 'height: 250px'" />
            </div>
        </Transition>

        <!-- Footer: live stats -->
        <div class="wysiwyg-footer flex items-center justify-between gap-2 px-3 py-1.5 border-t border-surface-200 dark:border-surface-700 bg-surface-50/60 dark:bg-surface-800/40 text-2xs text-surface-500 dark:text-surface-400">
            <span>{{ stats.words }} {{ stats.words === 1 ? 'word' : 'words' }} · {{ stats.chars }} chars</span>
            <span v-if="showSource" class="font-semibold uppercase tracking-wide text-primary-500">Wikitext source</span>
        </div>
    </div>

    <!-- Sub-dialog for Notes References insertion -->
    <Dialog v-model:visible="showRefParamDialog" :header="refDialogHeader" modal class="w-full max-w-md" :draggable="false">
        <div class="flex flex-col gap-3">
            <!-- Wrap in <ref> Option for citations -->
            <div v-if="['Refcheck', 'Refurl', 'cn'].includes(currentRefType)" 
                class="p-3 bg-primary-50 dark:bg-primary-900/10 border border-primary-200 dark:border-primary-800 rounded-lg flex flex-col gap-2">
                <div class="flex items-center gap-2">
                    <Checkbox v-model="wrapInRef" :binary="true" inputId="wrapInRef" />
                    <label for="wrapInRef" class="text-sm font-bold cursor-pointer select-none flex items-center gap-2">
                         Wrap in &lt;ref&gt; tags
                         <BookOpen class="w-3.5 h-3.5 text-primary-600" />
                    </label>
                </div>
                <p class="text-[11px] text-surface-500 dark:text-surface-400 pl-7 leading-tight">
                    This will place the citation in the <strong>References</strong> section at the bottom of the page.
                    Disable this if you want to insert the template directly in-line.
                </p>
            </div>

            <div v-if="currentRefType === 'Refcheck'" class="flex flex-col gap-2 pt-2">
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
            <div v-if="currentRefType === 'Refurl'" class="flex flex-col gap-2 pt-2">
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
            <div v-if="currentRefType === 'cn'" class="flex flex-col gap-2 pt-2">
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
            <div v-else-if="currentRefType === 'key'" class="flex flex-col gap-6">
                <!-- Selection List -->
                <div class="flex flex-col gap-4 max-h-[300px] overflow-y-auto pr-2">
                    <div v-for="group in KEYBOARD_GROUPS" :key="group.label" class="flex flex-col gap-2">
                        <label class="text-xs font-bold uppercase text-surface-400 dark:text-surface-500 tracking-wider ml-1">{{ group.label }}</label>
                        <div class="flex flex-wrap gap-1.5">
                            <Button v-for="item in group.items" :key="item.value"
                                :label="item.label" size="small" severity="secondary" variant="outlined"
                                @click="addStandardKey(item.value)"
                                class="py-1! px-2! text-xs font-mono" />
                        </div>
                    </div>
                </div>

                <!-- Custom Key Input -->
                <div class="flex flex-col gap-2 pt-4 border-t border-surface-200 dark:border-surface-700">
                    <label class="text-xs font-bold uppercase text-surface-500">Add Custom Key</label>
                    <InputGroup>
                        <InputText v-model="customKey" placeholder="e.g. MediaPlay" @keyup.enter="addCustomKey" />
                        <Button @click="addCustomKey" severity="secondary">
                            <Plus class="w-4 h-4" />
                        </Button>
                    </InputGroup>
                </div>

                <!-- Reorder List (Horizontal) -->
                <div v-if="selectedKeys.length > 0" class="flex flex-col gap-2">
                    <label class="text-xs font-bold uppercase text-surface-500">Order (Drag to reorder)</label>
                    <VueDraggable v-model="selectedKeys" class="flex flex-wrap items-center gap-2 bg-surface-50 dark:bg-surface-900 p-3 rounded-lg border border-dashed border-surface-300 dark:border-surface-700" handle=".drag-handle">
                        <div v-for="(key, index) in selectedKeys" :key="index"
                            class="flex items-center gap-2 bg-surface-0 dark:bg-surface-800 px-2 py-1 rounded-md border border-surface-200 dark:border-surface-700 shadow-sm animate-in fade-in zoom-in duration-200">
                            <div class="drag-handle cursor-grab active:cursor-grabbing text-surface-400">
                                <GripVertical class="w-3 h-3" />
                            </div>
                            <span class="font-mono text-sm font-bold">{{ getKeyLabel(key) }}</span>
                            <button @click="removeKey(index)" class="text-surface-400 hover:text-danger-500 p-0.5 transition-colors">
                                <X class="w-3 h-3" />
                            </button>
                        </div>
                    </VueDraggable>
                    <p class="text-xs text-surface-400 italic">Format: &#123;&#123;Key|{{ selectedKeys.join('|') }}&#125;&#125;</p>
                </div>
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
            <div class="flex justify-end gap-2 mt-4 w-full">
                <Button label="Cancel" text @click="showRefParamDialog = false" class="ml-auto" />
                <Button label="Insert" @click="insertReference" />
            </div>
        </div>
    </Dialog>

    <!-- Sub-dialog for Fixbox insertion -->
    <Dialog v-model:visible="showFixboxDialog" :header="fixboxDialogHeader" modal class="w-full max-w-md" :draggable="false">
        <div class="flex flex-col gap-4">
            <InputGroup>
                <InputGroupAddon>Name/Description</InputGroupAddon>
                <InputText v-model="tempFixboxParams.description" placeholder="Short description or name of the fix" />
            </InputGroup>

            <div class="flex flex-col gap-2 p-3 bg-surface-50 dark:bg-surface-800/50 rounded-lg border border-surface-200 dark:border-surface-700">
                <div class="flex items-center justify-between gap-4">
                    <label class="text-xs font-bold uppercase text-surface-500 tracking-wider">Reference</label>
                    <div v-if="tempFixboxParams.ref" class="flex items-center gap-2 max-w-[200px]">
                        <span class="text-[11px] truncate italic text-primary-500 font-mono" :title="tempFixboxParams.ref">
                            {{ tempFixboxParams.ref }}
                        </span>
                        <Button icon="pi pi-times" severity="danger" text rounded size="small" 
                            class="w-6! h-6!" @click="tempFixboxParams.ref = ''" v-tooltip.top="'Clear reference'" />
                    </div>
                </div>
                
                <div class="flex items-center gap-2">
                    <Button size="small" rounded outlined severity="secondary" @click="openRefParamDialog('Refcheck', 'fixbox')" 
                        class="flex-1 gap-2" v-tooltip.top="'Add Refcheck'">
                        <ListChecks class="w-4 h-4" />
                        <span class="text-xs hidden sm:inline">Refcheck</span>
                    </Button>
                    <Button size="small" rounded outlined severity="secondary" @click="openRefParamDialog('Refurl', 'fixbox')" 
                        class="flex-1 gap-2" v-tooltip.top="'Add Refurl'">
                        <Link2 class="w-4 h-4" />
                        <span class="text-xs hidden sm:inline">Refurl</span>
                    </Button>
                    <Button size="small" rounded outlined severity="secondary" @click="openRefParamDialog('cn', 'fixbox')" 
                        class="flex-1 gap-2" v-tooltip.top="'Add Citation Required'">
                        <MessageSquareWarning class="w-4 h-4" />
                        <span class="text-xs hidden sm:inline">Citation</span>
                    </Button>
                </div>
            </div>

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

            <div class="flex justify-end gap-2 mt-4 w-full">
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
    border: none !important;
    border-bottom: 1px solid var(--p-surface-200) !important;
    border-radius: 0 !important;
}

.dark .wysiwyg-editor-container .p-editor-toolbar {
    border-bottom-color: var(--p-surface-700) !important;
}

/* Card owns the frame — drop the editor's own borders/radius */
.wysiwyg-editor-container .p-editor-container,
.wysiwyg-editor-container .p-editor-content {
    border: none !important;
    border-radius: 0 !important;
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

.custom-action-btn:focus-visible {
    outline: none !important;
    box-shadow: 0 0 0 2px var(--p-primary-500) !important;
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

/* Inline rendered wiki tokens (citations, keys, wiki links) inserted via the toolbar */
.wiki-token {
    cursor: pointer;
    border-radius: 4px;
    padding: 0 1px;
}

.wiki-token:hover {
    background-color: var(--p-primary-50);
    outline: 1px solid var(--p-primary-200);
}

.dark .wiki-token:hover {
    background-color: color-mix(in srgb, var(--p-primary-500) 15%, transparent);
    outline-color: var(--p-primary-800);
}

.wiki-token .keypress {
    display: inline-block;
    min-width: 1.2em;
    padding: 0 5px;
    border: 1px solid var(--p-surface-300);
    border-bottom-width: 2px;
    border-radius: 4px;
    background: var(--p-surface-100);
    font-family: ui-monospace, monospace;
    font-size: 0.85em;
    line-height: 1.5;
    text-align: center;
}

.dark .wiki-token .keypress {
    border-color: var(--p-surface-600);
    background: var(--p-surface-800);
}

.wiki-token .reference-text {
    font-size: 0.85em;
    color: var(--p-surface-500);
}

/* {{mm}} "more info" definition list */
.wiki-mm dl {
    margin: 0;
    padding: 0;
}

.wiki-mm dd {
    margin: 0 0 2px 0;
}
</style>
