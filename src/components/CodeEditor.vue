<script setup lang="ts">
import { ref, onMounted, watch, onUnmounted } from 'vue';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';
import { mediawiki } from '@bhsd/codemirror-wikitext';
import { oneDark } from '@codemirror/theme-one-dark';
// @ts-ignore - JSON import
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
    const observer = new MutationObserver(() => {
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

    observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
    });

    // Store observer for cleanup
    (editorView as any)._themeObserver = observer;
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
    if (editorView) {
        const observer = (editorView as any)._themeObserver;
        if (observer) {
            observer.disconnect();
        }
        editorView.destroy();
    }
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
