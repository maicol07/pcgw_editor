import { ref, type Ref } from 'vue';
import { z } from 'zod';
import { fieldsConfig } from '../../config/fields';
import { subFieldOf } from '../../types/schema';
// AIService is imported lazily at the call site: a static import pulls the three @ai-sdk
// providers (~700 kB) into the startup bundle for a feature many sessions never use.
import { hasActiveKey } from '../../services/ai/aiConfig';
import { SettingsVideo } from '../../models/GameData';

const triState = z.enum(['true', 'false', 'unknown']);
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

export interface VideoFieldComparison {
    fieldKey: keyof SettingsVideo;
    label: string;
    category: string;
    currentValue: string;
    proposedValue: string;
    currentTech?: string;
    proposedTech?: string;
    currentNotes?: string;
    proposedNotes?: string;
    status: 'changed' | 'unchanged' | 'unknown';
    selected: boolean;
}

export interface VideoAnalysisFieldDef {
    key: keyof SettingsVideo;
    label: string;
    category: string;
    techField?: keyof SettingsVideo;
    notesField?: keyof SettingsVideo;
}

export function getVideoAnalysisFields(): VideoAnalysisFieldDef[] {
    const videoSection = fieldsConfig.find(s => s.id === 'video');
    if (!videoSection) return [];

    const fieldDefs: VideoAnalysisFieldDef[] = [];
    const groups = videoSection.groups || [];

    for (const group of groups) {
        for (const field of group.fields) {
            if (field.component === 'CompoundRatingField') {
                const rawKey = field.key.startsWith('video.') ? field.key.slice(6) : field.key;
                const propKey = (subFieldOf(field) || rawKey) as keyof SettingsVideo;

                const notesKey = `${propKey}Notes` as keyof SettingsVideo;
                const techKey = propKey === 'upscaling' 
                    ? ('upscalingTech' as keyof SettingsVideo) 
                    : propKey === 'frameGen' 
                        ? ('frameGenTech' as keyof SettingsVideo) 
                        : undefined;

                fieldDefs.push({
                    key: propKey,
                    label: field.label,
                    category: group.title,
                    techField: techKey,
                    notesField: notesKey
                });
            }
        }
    }

    return fieldDefs;
}

export function computeVideoComparisons(
    current: SettingsVideo,
    aiResult: VideoAnalysisResult,
    fields: VideoAnalysisFieldDef[] = getVideoAnalysisFields()
): VideoFieldComparison[] {
    const comparisons: VideoFieldComparison[] = [];

    for (const field of fields) {
        const currentVal = (current[field.key] as string) || 'unknown';
        const proposedVal = (aiResult[field.key as keyof VideoAnalysisResult] as string) || 'unknown';

        let currentTech: string | undefined;
        let proposedTech: string | undefined;
        if (field.techField) {
            currentTech = (current[field.techField] as string) || undefined;
            if (field.key === 'upscaling') {
                proposedTech = aiResult.upscalingTech;
            } else if (field.key === 'frameGen') {
                proposedTech = aiResult.frameGenTech;
            }
        }

        let currentNotes: string | undefined;
        let proposedNotes: string | undefined;
        if (field.notesField) {
            currentNotes = (current[field.notesField] as string) || undefined;
            if (field.key === 'antiAliasing') {
                proposedNotes = aiResult._notes?.antiAliasing;
            } else if (field.key === 'fov') {
                proposedNotes = aiResult._notes?.fov;
            } else if (field.key === 'upscaling') {
                proposedNotes = aiResult._notes?.upscaling;
            }
        }

        const isProposedValidRating = proposedVal === 'true' || proposedVal === 'false';
        const hasProposedTech = !!(proposedTech && proposedTech.trim());
        const hasProposedNotes = !!(proposedNotes && proposedNotes.trim());

        let status: 'changed' | 'unchanged' | 'unknown' = 'unknown';

        if (isProposedValidRating || hasProposedTech || hasProposedNotes) {
            const valChanged = isProposedValidRating && proposedVal !== currentVal;
            const techChanged = hasProposedTech && proposedTech !== currentTech;
            const notesChanged = hasProposedNotes && proposedNotes !== currentNotes;

            if (valChanged || techChanged || notesChanged) {
                status = 'changed';
            } else {
                status = 'unchanged';
            }
        } else {
            status = 'unknown';
        }

        comparisons.push({
            fieldKey: field.key,
            label: field.label,
            category: field.category,
            currentValue: currentVal,
            proposedValue: proposedVal,
            currentTech,
            proposedTech,
            currentNotes,
            proposedNotes,
            status,
            selected: status === 'changed'
        });
    }

    return comparisons;
}

export function applyVideoComparisons(
    current: SettingsVideo,
    comparisons: VideoFieldComparison[],
    aiResult: VideoAnalysisResult
): SettingsVideo {
    const updated: SettingsVideo = { ...current };

    for (const comp of comparisons) {
        if (!comp.selected) continue;

        if (comp.proposedValue === 'true' || comp.proposedValue === 'false') {
            (updated as any)[comp.fieldKey] = comp.proposedValue;
        }

        if (comp.fieldKey === 'upscaling' && aiResult.upscalingTech) {
            updated.upscalingTech = aiResult.upscalingTech;
        }
        if (comp.fieldKey === 'frameGen' && aiResult.frameGenTech) {
            updated.frameGenTech = aiResult.frameGenTech;
        }

        if (comp.fieldKey === 'antiAliasing' && aiResult._notes?.antiAliasing) {
            updated.antiAliasingNotes = aiResult._notes.antiAliasing;
        }
        if (comp.fieldKey === 'fov' && aiResult._notes?.fov) {
            updated.fovNotes = aiResult._notes.fov;
        }
        if (comp.fieldKey === 'upscaling' && aiResult._notes?.upscaling) {
            updated.upscalingNotes = aiResult._notes.upscaling;
        }
    }

    return updated;
}

export function useVideoAnalysis(video: Ref<SettingsVideo>) {
    const isAnalyzing = ref(false);
    const error = ref('');
    const analysisSuccess = ref(false);
    const showAnalysis = ref(false);
    const lastResult = ref<VideoAnalysisResult | null>(null);
    const comparisons = ref<VideoFieldComparison[]>([]);

    const analyzeScreenshot = async (file: File) => {
        if (!hasActiveKey()) {
            error.value = "AI API key not found. Please add it in Settings → Integrations.";
            return;
        }

        isAnalyzing.value = true;
        error.value = '';
        analysisSuccess.value = false;
        showAnalysis.value = true;

        try {
            const base64 = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(file);
            });

            const prompt = `
          Analyze this game settings screenshot (video/graphics).
          Extract settings: resolution (widescreen, 4k, ultra), window modes, FOV, AA, AF, VSync, FPS limits, HDR, Ray Tracing, Upscaling (DLSS, FSR, XeSS), Frame Gen.
          
          Return JSON ONLY:
          {
              "widescreenResolution": "true/false/unknown",
              "multiMonitor": "true/false/unknown",
              "ultraWidescreen": "true/false/unknown",
              "fourKUltraHd": "true/false/unknown",
              "fov": "true/false/unknown",
              "windowed": "true/false/unknown",
              "borderlessWindowed": "true/false/unknown",
              "anisotropic": "true/false/unknown",
              "antiAliasing": "true/false/unknown",
              "upscaling": "true/false/unknown",
              "upscalingTech": "string",
              "frameGen": "true/false/unknown",
              "frameGenTech": "string",
              "vsync": "true/false/unknown",
              "fps60": "true/false/unknown",
              "fps120": "true/false/unknown",
              "hdr": "true/false/unknown",
              "rayTracing": "true/false/unknown",
              "colorBlind": "true/false/unknown",
              "_notes": { "antiAliasing": "...", "fov": "...", "upscaling": "..." }
          }`;

            const { analyzeImageJSON } = await import('../../services/ai/AIService');
            const result = (await analyzeImageJSON(base64, videoAnalysisSchema, prompt)) as VideoAnalysisResult;

            lastResult.value = result;
            comparisons.value = computeVideoComparisons(video.value, result);
            analysisSuccess.value = true;
        } catch (e: any) {
            console.error("Analysis failed:", e);
            error.value = `Analysis failed: ${e.message}`;
        } finally {
            isAnalyzing.value = false;
        }
    };

    const applySelectedChanges = () => {
        if (!lastResult.value) return;
        video.value = applyVideoComparisons(video.value, comparisons.value, lastResult.value);
    };

    return {
        isAnalyzing,
        error,
        analysisSuccess,
        showAnalysis,
        lastResult,
        comparisons,
        analyzeScreenshot,
        applySelectedChanges
    };
}
