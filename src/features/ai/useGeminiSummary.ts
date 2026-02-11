import { ref, inject, type Ref } from 'vue';
import { GeminiService } from '../../services/GeminiService';
import { GameData } from '../../models/GameData';

export function useGeminiSummary(pageTitle: Ref<string>, gameData: Ref<GameData>, apiKey?: Ref<string>) {
    const injectedApiKey = inject<Ref<string>>('geminiApiKey');
    const geminiApiKey = apiKey || injectedApiKey;
    const isGeneratingSummary = ref(false);
    const shareSummaryVisible = ref(false);
    const shareSummaryText = ref('');
    const showApiKeyDialog = ref(false);
    const tempApiKey = ref('');

    const saveApiKey = () => {
        if (tempApiKey.value.trim()) {
            if (geminiApiKey) geminiApiKey.value = tempApiKey.value.trim();
            localStorage.setItem('gemini-api-key', tempApiKey.value.trim());
            showApiKeyDialog.value = false;
            tempApiKey.value = '';
        }
    };

    const clearApiKey = () => {
        if (geminiApiKey) geminiApiKey.value = '';
        localStorage.removeItem('gemini-api-key');
        tempApiKey.value = '';
    };

    const generateShareSummary = async () => {
        if (!geminiApiKey?.value) {
            showApiKeyDialog.value = true;
            return;
        }

        isGeneratingSummary.value = true;
        shareSummaryVisible.value = true;

        try {
            const geminiService = new GeminiService(geminiApiKey.value);
            shareSummaryText.value = await geminiService.generateShareSummary(pageTitle.value, gameData.value);
        } catch (e: any) {
            shareSummaryText.value = 'Error generating summary: ' + e.message;
            if (e.message.includes('API key')) {
                localStorage.removeItem('gemini-api-key');
                if (geminiApiKey) geminiApiKey.value = '';
            }
        } finally {
            isGeneratingSummary.value = false;
        }
    };

    const copyShareSummary = async () => {
        if (shareSummaryText.value) {
            await navigator.clipboard.writeText(shareSummaryText.value);
            alert('Copied to clipboard!');
        }
    };

    return {
        isGeneratingSummary,
        shareSummaryVisible,
        shareSummaryText,
        showApiKeyDialog,
        tempApiKey,
        saveApiKey,
        clearApiKey,
        generateShareSummary,
        copyShareSummary,
    };
}
