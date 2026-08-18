import { ref, type Ref } from 'vue';
import { z } from 'zod';
import { hasActiveKey } from '../../services/ai/aiConfig';
import { SettingsVideo } from '../../models/GameData';
import { 
    getSectionAnalysisFields, 
    getSectionAnalysisPrompt,
    computeSectionComparisons, 
    applySectionComparisons,
    type AnalysisFieldDef,
    type FieldComparison,
    type SectionAnalysisResult
} from '../analysis/useSectionAnalysis';

export const triState = z.enum(['true', 'false', 'unknown']);
export const videoAnalysisSchema = z.object({
    widescreenResolution: triState,
    multiMonitor: triState,
    ultraWidescreen: triState,
    fourKUltraHd: triState,
    fov: triState,
    windowed: triState,
    borderlessWindowed: triState,
    anisotropic: triState,
    antiAliasing: triState,
    upscaling: triState,
    upscalingTech: z.string(),
    frameGen: triState,
    frameGenTech: z.string(),
    vsync: triState,
    fps60: triState,
    fps120: triState,
    hdr: triState,
    rayTracing: triState,
    colorBlind: triState,
    _notes: z.object({
        antiAliasing: z.string(),
        fov: z.string(),
        upscaling: z.string(),
    }).partial(),
}).partial();

export type VideoAnalysisResult = z.infer<typeof videoAnalysisSchema>;

export type VideoFieldComparison = FieldComparison & {
    fieldKey: keyof SettingsVideo;
};

export type VideoAnalysisFieldDef = AnalysisFieldDef & {
    key: keyof SettingsVideo;
    techField?: keyof SettingsVideo;
    notesField?: keyof SettingsVideo;
};

export function getVideoAnalysisFields(): VideoAnalysisFieldDef[] {
    return getSectionAnalysisFields('video') as VideoAnalysisFieldDef[];
}

export function computeVideoComparisons(
    current: SettingsVideo,
    aiResult: VideoAnalysisResult | SectionAnalysisResult,
    fields: VideoAnalysisFieldDef[] = getVideoAnalysisFields()
): VideoFieldComparison[] {
    return computeSectionComparisons('video', current, aiResult, fields) as VideoFieldComparison[];
}

export function applyVideoComparisons(
    current: SettingsVideo,
    comparisons: VideoFieldComparison[],
    aiResult?: VideoAnalysisResult | SectionAnalysisResult
): SettingsVideo {
    return applySectionComparisons('video', current, comparisons, aiResult);
}

export function useVideoAnalysis(video: Ref<SettingsVideo>) {
    const isAnalyzing = ref(false);
    const error = ref('');
    const lastResult = ref<VideoAnalysisResult | null>(null);

    const analyzeScreenshot = async (file: File) => {
        if (!hasActiveKey()) {
            error.value = "AI API key not found. Please add it in Settings → Integrations.";
            return;
        }

        isAnalyzing.value = true;
        error.value = '';

        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const prompt = getSectionAnalysisPrompt('video');
            const { analyzeImageJSON } = await import('../../services/ai/AIService');
            const result = (await analyzeImageJSON(base64, videoAnalysisSchema, prompt)) as VideoAnalysisResult;

            lastResult.value = result;
            const comparisons = computeVideoComparisons(video.value, result);
            video.value = applyVideoComparisons(video.value, comparisons, result);
        } catch (e: any) {
            console.error("Analysis failed:", e);
            error.value = `Analysis failed: ${e.message}`;
        } finally {
            isAnalyzing.value = false;
        }
    };

    return {
        isAnalyzing,
        error,
        analyzeScreenshot,
        lastResult
    };
}
