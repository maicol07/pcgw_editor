import { ref, type Ref } from 'vue';
// AIService is imported lazily at the call site: a static import pulls the three @ai-sdk
// providers (~700 kB) into the startup bundle for a feature many sessions never use.
import { hasActiveKey } from '../../services/ai/aiConfig';
import { GameData } from '../../models/GameData';
import { useUiStore } from '../../stores/ui';
import { useToast } from 'openvue/usetoast';

export function useAISummary(pageTitle: Ref<string>, gameData: Ref<GameData>) {
    const uiStore = useUiStore();
    const toast = useToast();
    const isGeneratingSummary = ref(false);
    const shareSummaryVisible = ref(false);
    const shareSummaryText = ref('');

    const generateSummary = async () => {
        if (!hasActiveKey()) {
            toast.add({
                severity: 'warn',
                summary: 'API Key Required',
                detail: 'Please configure your AI provider and API key in Settings → Integrations.',
                life: 4000
            });
            uiStore.openSettings('integrations');
            return;
        }

        isGeneratingSummary.value = true;
        shareSummaryVisible.value = true;
        shareSummaryText.value = '';

        try {
            // Stream so the summary fills in progressively.
            const { generateShareSummary } = await import('../../services/ai/AIService');
            await generateShareSummary(pageTitle.value, gameData.value, (full) => {
                shareSummaryText.value = full;
            });
        } catch (e: any) {
            shareSummaryText.value = 'Error generating summary: ' + e.message;
        } finally {
            isGeneratingSummary.value = false;
        }
    };

    const copyShareSummary = async () => {
        if (shareSummaryText.value) {
            await navigator.clipboard.writeText(shareSummaryText.value);
            toast.add({
                severity: 'success',
                summary: 'Copied',
                detail: 'Summary copied to clipboard.',
                life: 2000
            });
        }
    };

    return {
        isGeneratingSummary,
        shareSummaryVisible,
        shareSummaryText,
        generateShareSummary: generateSummary,
        copyShareSummary,
    };
}
