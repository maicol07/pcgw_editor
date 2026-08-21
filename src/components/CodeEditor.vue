<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { mediawiki } from '@bhsd/codemirror-wikitext';
import { oneDark } from '@codemirror/theme-one-dark';
import config from 'wikiparser-node/config/default.json';
import { useUiStore } from '../stores/ui';

interface Props {
    modelValue: string;
}

interface Emits {
    (e: 'update:modelValue', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();
const uiStore = useUiStore();

const editorContainer = ref<HTMLDivElement | null>(null);
let editorView: EditorView | null = null;
let themeObserver: MutationObserver | null = null;

// Track if we're updating from external source to prevent loop
let isExternalUpdate = false;

const isDark = ref(false);

// Check if dark mode is active
const checkDarkMode = () => {
    isDark.value = document.documentElement.classList.contains('dark');
};

const createExtensions = () => {
    const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged && !isExternalUpdate) {
            const newValue = update.state.doc.toString();
            emit('update:modelValue', newValue);
        }
    });

    const wikitextSupport = mediawiki(config as any);

    const getFontFamilyCss = (family: string | undefined): string => {
        switch (family) {
            case 'JetBrains Mono':
                return "'JetBrains Mono', monospace";
            case 'Fira Code':
                return "'Fira Code', monospace";
            case 'Source Code Pro':
                return "'Source Code Pro', monospace";
            case 'Cascadia Code':
                return "'Cascadia Code', monospace";
            case 'Consolas':
                return "Consolas, 'Courier New', monospace";
            default:
                return "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
        }
    };

    const themeStyles: Record<string, any> = {
        '&': {
            height: '100%',
            fontSize: `${uiStore.editorFontSize || 14}px`,
        },
        '.cm-scroller': {
            fontFamily: getFontFamilyCss(uiStore.editorFontFamily),
        },
    };

    if (!uiStore.editorLineNumbers) {
        themeStyles['.cm-gutters'] = { display: 'none !important' };
    }

    const extensions = [
        basicSetup,
        wikitextSupport,
        updateListener,
        EditorState.tabSize.of(uiStore.editorTabSize || 4),
        EditorView.theme(themeStyles),
    ];

    if (uiStore.editorLineWrapping) {
        extensions.push(EditorView.lineWrapping);
    }

    if (isDark.value) {
        extensions.push(oneDark);
    }

    return extensions;
};

const rebuildEditor = () => {
    if (!editorContainer.value) return;
    const currentDoc = editorView ? editorView.state.doc.toString() : props.modelValue;
    if (editorView) {
        editorView.destroy();
        editorView = null;
    }

    const state = EditorState.create({
        doc: currentDoc,
        extensions: createExtensions(),
    });

    editorView = new EditorView({
        state,
        parent: editorContainer.value,
    });

    scrollElement.value = editorContainer.value.querySelector('.cm-scroller') as HTMLElement || editorView.scrollDOM || null;
};

onMounted(() => {
    if (!editorContainer.value) return;

    checkDarkMode();
    rebuildEditor();

    // Watch for dark mode changes
    themeObserver = new MutationObserver(() => {
        const wasDark = isDark.value;
        checkDarkMode();
        if (wasDark !== isDark.value) {
            rebuildEditor();
        }
    });

    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });
});

// Watch for editor settings changes
watch(
    [
        () => uiStore.editorFontSize,
        () => uiStore.editorFontFamily,
        () => uiStore.editorLineWrapping,
        () => uiStore.editorLineNumbers,
        () => uiStore.editorTabSize,
    ],
    () => {
        rebuildEditor();
    }
);

const scrollElement = ref<HTMLElement | null>(null);

defineExpose({
    getScrollElement: () => editorContainer.value?.querySelector('.cm-scroller') as HTMLElement || editorView?.scrollDOM || null,
    scrollElement,
});

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
    if (!editorView) return;
    
    const currentValue = editorView.state.doc.toString();
    if (currentValue !== newValue) {
        isExternalUpdate = true;
        editorView.dispatch({
            changes: {
                from: 0,
                to: currentValue.length,
                insert: newValue,
            },
        });
        isExternalUpdate = false;
    }
});

onUnmounted(() => {
    // Unconditional: the observer must go even if editorView was replaced or never created.
    themeObserver?.disconnect();
    themeObserver = null;
    editorView?.destroy();
    editorView = null;
});
</script>

<template>
    <div ref="editorContainer" class="codemirror-wrapper"></div>
</template>

<style scoped>
.codemirror-wrapper {
    height: 100%;
    width: 100%;
}

.codemirror-wrapper :deep(.cm-editor) {
    height: 100%;
}

.codemirror-wrapper :deep(.cm-scroller) {
    overflow: auto;
}
</style>
