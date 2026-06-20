import { ref, type Ref } from 'vue';
import { z } from 'zod';
import { analyzeImageJSON } from '../../services/ai/AIService';
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

export function useVideoAnalysis(video: Ref<SettingsVideo>) {
    const isAnalyzing = ref(false);
    const error = ref('');
    const analysisSuccess = ref(false);
    const showAnalysis = ref(false);

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

            const result = await analyzeImageJSON(base64, videoAnalysisSchema, prompt) as any;

            const fields = [
                'widescreenResolution', 'multiMonitor', 'ultraWidescreen', 'fourKUltraHd',
                'fov', 'windowed', 'borderlessWindowed', 'anisotropic', 'antiAliasing',
                'upscaling', 'frameGen', 'vsync', 'fps60', 'fps120', 'hdr', 'rayTracing', 'colorBlind'
            ];

            fields.forEach(field => {
                const val = result[field];
                if (val && (val === 'true' || val === 'false')) {
                    (video.value as any)[field] = val;
                }
            });

            if (result.upscalingTech) video.value.upscalingTech = result.upscalingTech;
            if (result.frameGenTech) video.value.frameGenTech = result.frameGenTech;

            if (result._notes) {
                if (result._notes.antiAliasing) video.value.antiAliasingNotes = result._notes.antiAliasing;
                if (result._notes.fov) video.value.fovNotes = result._notes.fov;
                if (result._notes.upscaling) video.value.upscalingNotes = result._notes.upscaling;
            }

            analysisSuccess.value = true;
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
        analysisSuccess,
        showAnalysis,
        analyzeScreenshot
    };
}
