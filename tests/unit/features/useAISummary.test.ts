import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ref } from 'vue';
import { createPinia, setActivePinia } from 'pinia';
import { useAISummary } from '../../../src/features/ai/useAISummary';
import { useUiStore } from '../../../src/stores/ui';
import { initialGameData, type GameData } from '../../../src/models/GameData';

const mockToast = {
    add: vi.fn(),
};

vi.mock('openvue/usetoast', () => ({
    useToast: () => mockToast,
}));

let mockHasKey = false;
vi.mock('../../../src/services/ai/aiConfig', () => ({
    hasActiveKey: () => mockHasKey,
    aiConfig: {
        provider: 'google',
        keys: { google: '' },
    },
}));

const mockGenerate = vi.fn();
vi.mock('../../../src/services/ai/AIService', () => ({
    generateShareSummary: (...args: any[]) => mockGenerate(...args),
}));

describe('useAISummary', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        mockToast.add.mockClear();
        mockGenerate.mockClear();
        mockHasKey = false;
    });

    const getGameData = (): GameData => JSON.parse(JSON.stringify(initialGameData));

    it('opens settings on integrations tab and shows toast if no key is configured', async () => {
        const pageTitle = ref('Doom');
        const gameData = ref(getGameData());
        const store = useUiStore();

        const { generateShareSummary, shareSummaryVisible } = useAISummary(pageTitle, gameData);

        await generateShareSummary();

        expect(mockToast.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'warn',
                summary: 'API Key Required',
            })
        );
        expect(store.isSettingsOpen).toBe(true);
        expect(store.settingsTab).toBe('integrations');
        expect(shareSummaryVisible.value).toBe(false);
        expect(mockGenerate).not.toHaveBeenCalled();
    });

    it('generates summary and populates stream when key is present', async () => {
        mockHasKey = true;
        mockGenerate.mockImplementation(async (_title, _data, onProgress) => {
            onProgress('Summary snippet');
            return 'Summary snippet';
        });

        const pageTitle = ref('Doom');
        const gameData = ref(getGameData());

        const { generateShareSummary, shareSummaryVisible, shareSummaryText, isGeneratingSummary } =
            useAISummary(pageTitle, gameData);

        const promise = generateShareSummary();
        expect(shareSummaryVisible.value).toBe(true);
        await promise;

        expect(isGeneratingSummary.value).toBe(false);
        expect(shareSummaryText.value).toBe('Summary snippet');
        expect(mockGenerate).toHaveBeenCalled();
    });

    it('copies text and shows toast on copyShareSummary', async () => {
        const writeTextMock = vi.fn().mockResolvedValue(undefined);
        Object.assign(navigator, {
            clipboard: {
                writeText: writeTextMock,
            },
        });

        const pageTitle = ref('Doom');
        const gameData = ref(getGameData());
        const { shareSummaryText, copyShareSummary } = useAISummary(pageTitle, gameData);

        shareSummaryText.value = 'Text to copy';
        await copyShareSummary();

        expect(writeTextMock).toHaveBeenCalledWith('Text to copy');
        expect(mockToast.add).toHaveBeenCalledWith(
            expect.objectContaining({
                severity: 'success',
                summary: 'Copied',
            })
        );
    });
});
