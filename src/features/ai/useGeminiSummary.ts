import { ref, type Ref } from 'vue';
import { generateShareSummary } from '../../services/ai/AIService';
import { aiConfig, activeKey, hasActiveKey } from '../../services/ai/aiConfig';
import { GameData } from '../../models/GameData';

export function useGeminiSummary(pageTitle: Ref<string>, gameData: Ref<GameData>) {
    const isGeneratingSummary = ref(false);
    const shareSummaryVisible = ref(false);
    const shareSummaryText = ref('');
    const showApiKeyDialog = ref(false);
    const tempApiKey = ref('');

    const saveApiKey = () => {
        if (tempApiKey.value.trim()) {
            aiConfig.keys[aiConfig.provider] = tempApiKey.value.trim();
            showApiKeyDialog.value = false;
            tempApiKey.value = '';
        }
    };

    const clearApiKey = () => {
        aiConfig.keys[aiConfig.provider] = '';
        tempApiKey.value = '';
    };

    const generateSummary = async () => {
        if (!hasActiveKey()) {
            showApiKeyDialog.value = true;
            return;
        }

        isGeneratingSummary.value = true;
        shareSummaryVisible.value = true;
        shareSummaryText.value = '';

        try {
            // Stream so the summary fills in progressively.
            await generateShareSummary(pageTitle.value, gameData.value, (full) => {
                shareSummaryText.value = full;
            });
        } catch (e: any) {
            shareSummaryText.value = 'Error generating summary: ' + e.message;
            if (e.message.includes('API key') || e.message.includes('API_KEY')) {
                clearApiKey();
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
        activeKey,
        saveApiKey,
        clearApiKey,
        generateShareSummary: generateSummary,
        copyShareSummary,
    };
}
