<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { mediawiki } from '@bhsd/codemirror-wikitext';
import { oneDark } from '@codemirror/theme-one-dark';
import config from 'wikiparser-node/config/default.json';

interface Props {
    modelValue: string;
}

interface Emits {
    (e: 'update:modelValue', value: string): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

const editorContainer = ref<HTMLDivElement | null>(null);
let editorView: EditorView | null = null;
// Held in the setup scope, not on the EditorView. It used to be stashed as
// editorView._themeObserver, but a theme change replaces editorView with a fresh instance that has
// no such property — so onUnmounted read undefined, skipped disconnect(), and the observer stayed
// attached to <html> spawning orphan editors for the rest of the session.
let themeObserver: MutationObserver | null = null;

// Track if we're updating from external source to prevent loop
let isExternalUpdate = false;

const isDark = ref(false);

// Check if dark mode is active
const checkDarkMode = () => {
    isDark.value = document.documentElement.classList.contains('dark');
};

onMounted(() => {
    if (!editorContainer.value) return;

    checkDarkMode();

    const updateListener = EditorView.updateListener.of((update) => {
        if (update.docChanged && !isExternalUpdate) {
            const newValue = update.state.doc.toString();
            emit('update:modelValue', newValue);
        }
    });

    // Get the MediaWiki language support with all extensions
    const wikitextSupport = mediawiki(config as any);

    const extensions = [
        basicSetup,
        wikitextSupport,
        updateListener,
        EditorView.lineWrapping,
        EditorView.theme({
            '&': {
                height: '100%',
                fontSize: '14px',
            },
            '.cm-scroller': {
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            },
        }),
    ];

    if (isDark.value) {
        extensions.push(oneDark);
    }

    const state = EditorState.create({
        doc: props.modelValue,
        extensions,
    });

    editorView = new EditorView({
        state,
        parent: editorContainer.value,
    });

    // Watch for dark mode changes
    themeObserver = new MutationObserver(() => {
        const wasDark = isDark.value;
        checkDarkMode();
        
        // Recreate editor if theme changed
        if (wasDark !== isDark.value && editorView) {
            const currentDoc = editorView.state.doc.toString();
            editorView.destroy();
            
            const newExtensions = [
                basicSetup,
                wikitextSupport,
                updateListener,
                EditorView.lineWrapping,
                EditorView.theme({
                    '&': {
                        height: '100%',
                        fontSize: '14px',
                    },
                    '.cm-scroller': {
                        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    },
                }),
            ];

            if (isDark.value) {
                newExtensions.push(oneDark);
            }

            const newState = EditorState.create({
                doc: currentDoc,
                extensions: newExtensions,
            });

            editorView = new EditorView({
                state: newState,
                parent: editorContainer.value!,
            });
        }
    });

    themeObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });

    // Set scroll element reference for sync scroll
    scrollElement.value = editorContainer.value?.querySelector('.cm-scroller') as HTMLElement || editorView?.scrollDOM || null;
});

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
