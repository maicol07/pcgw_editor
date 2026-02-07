<script setup lang="ts">
import { ref, inject, type Ref } from 'vue';
import { SettingsVideo } from '../../models/GameData';
import Button from 'primevue/button';
import { 
  Upload, Sparkles as SparklesIcon, X
} from 'lucide-vue-next';
import { GeminiService } from '../../services/GeminiService';

const props = defineProps<{
  modelValue: SettingsVideo;
}>();

const emit = defineEmits<{
    (e: 'update:modelValue', value: SettingsVideo): void;
}>();

const geminiApiKey = inject<Ref<string>>('geminiApiKey');
const isAnalyzing = ref(false);
const error = ref('');
const analysisSuccess = ref(false);
const showAnalysis = ref(false);
const fileInput = ref<HTMLInputElement | null>(null);

const triggerFileInput = () => {
    fileInput.value?.click();
};

const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
        await analyzeScreenshot(target.files[0]);
    }
    // Reset inputs
    if (target.value) target.value = '';
};

// Handle Paste Event
const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) {
                await analyzeScreenshot(blob);
            }
            break;
        }
    }
};

const analyzeScreenshot = async (file: File) => {
    if (!geminiApiKey || !geminiApiKey.value) {
        error.value = "Gemini API key not found. Please add it in the top bar settings.";
        return;
    }

    isAnalyzing.value = true;
    error.value = '';
    analysisSuccess.value = false;
    showAnalysis.value = true;

    try {
        // Convert to Base64
        const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });

        const service = new GeminiService(geminiApiKey.value);
        
        const prompt = `
            Analyze this game settings screenshot (video/graphics).
            Extract the following settings:
            - Resolution support (widescreen, 4k, ultra-widescreen)
            - Window modes (windowed, borderless)
            - Field of View (FOV) slider presence
            - Anti-aliasing (AA) types (MSAA, FXAA, TAA, etc.)
            - Anisotropic Filtering (AF)
            - VSync
            - Frame rate limits (60, 120+, unlimited)
            - HDR
            - Ray Tracing
            - Upscaling (DLSS, FSR, XeSS) and Frame Generation
            
            Return JSON ONLY. Format:
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
                "upscalingTech": "string (e.g. DLSS 2, FSR 2)",
                "frameGen": "true/false/unknown",
                "frameGenTech": "string (e.g. DLSS 3)",
                "vsync": "true/false/unknown",
                "fps60": "true/false/unknown",
                "fps120": "true/false/unknown",
                "hdr": "true/false/unknown",
                "rayTracing": "true/false/unknown",
                "colorBlind": "true/false/unknown",
                "_notes": {
                    "widescreenResolution": "optional note",
                    "fov": "optional note about slider range",
                    "antiAliasing": "list of AA modes found",
                    "upscaling": "list of upscalers found"
                }
            }
            For boolean fields, use 'true', 'false', or 'unknown' (string).
            Be conservative. If not visible, use 'unknown'.
        `;

        const result = await service.analyzeImageJSON<any>(base64, prompt);
        
        const newVideo = { ...props.modelValue };
        const fields = [
            'widescreenResolution', 'multiMonitor', 'ultraWidescreen', 'fourKUltraHd',
            'fov', 'windowed', 'borderlessWindowed', 'anisotropic', 'antiAliasing',
            'upscaling', 'frameGen', 'vsync', 'fps60', 'fps120', 'hdr', 'rayTracing', 'colorBlind'
        ];

        let changesCount = 0;

        fields.forEach(field => {
            const val = result[field];
            if (val && (val === 'true' || val === 'false')) {
                 (newVideo as any)[field] = val;
                 changesCount++;
            }
        });

        // Special handling for Tech fields
        if (result.upscalingTech) newVideo.upscalingTech = result.upscalingTech;
        if (result.frameGenTech) newVideo.frameGenTech = result.frameGenTech;

        // Map notes if present/useful
        if (result._notes) {
            if (result._notes.antiAliasing) newVideo.antiAliasingNotes = result._notes.antiAliasing;
            if (result._notes.fov) newVideo.fovNotes = result._notes.fov;
            if (result._notes.upscaling) newVideo.upscalingNotes = result._notes.upscaling;
        }

        emit('update:modelValue', newVideo);

        analysisSuccess.value = true;
        
    } catch (e: any) {
        console.error("Analysis failed:", e);
        error.value = `Analysis failed: ${e.message}`;
    } finally {
        isAnalyzing.value = false;
    }
};

</script>

<template>
  <div class="flex flex-col gap-6" @paste="handlePaste">
    
    <!-- AI Analysis Section -->
    <div v-if="geminiApiKey" class="glass glass-border p-4 rounded-xl flex flex-col gap-4 relative overflow-hidden group transition-all duration-300">
        <div class="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <SparklesIcon class="w-24 h-24 text-primary-500" />
        </div>
        
        <div class="flex items-center justify-between relative z-10">
            <div class="flex items-center gap-3">
                <div class="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                    <SparklesIcon class="w-5 h-5" />
                </div>
                <div>
                   <h3 class="text-sm font-bold text-surface-900 dark:text-surface-100">AI Screenshot Analysis</h3>
                   <p class="text-xs text-surface-500 dark:text-surface-400">Paste or upload a settings screenshot to auto-fill</p>
                </div>
            </div>
            
            <input type="file" ref="fileInput" accept="image/*" class="hidden" @change="handleFileChange" />
            
            <Button 
                label="Analyze Image" 
                size="small" 
                @click="triggerFileInput" 
                :loading="isAnalyzing"
                :disabled="isAnalyzing"
                severity="primary"
                outlined
            >
                <template #icon>
                    <Upload class="w-4 h-4 mr-2" />
                </template>
            </Button>
        </div>

        <!-- Analysis Feedback -->
        <Transition name="fade">
            <div v-if="error" class="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded flex items-center gap-2">
                <X class="w-3 h-3" />
                {{ error }}
            </div>
            <div v-else-if="analysisSuccess" class="text-xs text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-2 rounded flex items-center gap-2">
                <SparklesIcon class="w-3 h-3" />
                Settings updated from screenshot!
            </div>
        </Transition>
    </div>

    <!-- Fallback if no Key -->
    <div v-else class="glass glass-border p-3 rounded-xl flex items-center justify-between gap-3 opacity-70 hover:opacity-100 transition-opacity">
        <div class="flex items-center gap-3">
             <div class="p-2 bg-surface-100 dark:bg-surface-800 rounded-lg">
                <SparklesIcon class="w-4 h-4 text-surface-400" />
            </div>
            <span class="text-xs font-medium text-surface-500">Add Gemini API Key to enable AI screenshot analysis</span>
        </div>
    </div>
  </div>
</template>
