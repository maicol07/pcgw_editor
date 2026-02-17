import { ref, computed, type Ref, type ComputedRef } from 'vue';
import { parseWikitext } from '../../utils/parser';
import { GameData } from '../../models/GameData';

export function useEditor(gameData: Ref<GameData>, wikitext: ComputedRef<string>, onSync?: (wikitext: string) => void) {
    const editorMode = ref<'Visual' | 'Code'>('Visual');
    const isModeSwitching = ref(false);
    const manualWikitext = ref('');
    const isCodeEditorLoaded = ref(false);

    const currentWikitext = computed(() =>
        editorMode.value === 'Visual' ? wikitext.value : manualWikitext.value
    );

    const handleModeChange = async (newMode: 'Visual' | 'Code') => {
        const oldMode = editorMode.value;
        editorMode.value = newMode;

        if (newMode === 'Code' && oldMode === 'Visual') {
            manualWikitext.value = wikitext.value;
            if (!isCodeEditorLoaded.value) isCodeEditorLoaded.value = true;
        } else if (newMode === 'Visual' && oldMode === 'Code') {
            isModeSwitching.value = true;
            try {
                await new Promise(r => setTimeout(r, 50));
                if (onSync) {
                    onSync(manualWikitext.value);
                } else {
                    const parsed = parseWikitext(manualWikitext.value);
                    gameData.value = parsed;
                }
            } catch (e) {
                console.error("Parse error", e);
            } finally {
                isModeSwitching.value = false;
            }
        }
    };

    return {
        editorMode,
        isModeSwitching,
        manualWikitext,
        isCodeEditorLoaded,
        currentWikitext,
        handleModeChange
    };
}
