<script setup lang="ts">
import { ref, inject, type Ref } from 'vue';
import { SettingsVideo } from '../models/GameData';
import RatingRow from './RatingRow.vue';
import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';
import Button from 'primevue/button';
import { 
  Monitor, Grid2X2, Maximize, Star, Eye, Minimize, Image, 
  ScanLine, LineChart, ArrowUpRight, FastForward, RefreshCcw, 
  Clock, Zap, Sun, Sparkles, Palette,
  Upload, Sparkles as SparklesIcon, Loader2, FileImage, X
} from 'lucide-vue-next';
import { GeminiService } from '../services/GeminiService';

const props = defineProps<{
  video: SettingsVideo;
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

        const result = await service.analyzeImageJSON<any>(base64, prompt); // Using generic for now, we could define interface
        
        // Map results to props
        // We do a merge: only update if 'unknown' or if result provides better info?
        // For now, let's overwrite if result is definite (true/false)
        
        const fields = [
            'widescreenResolution', 'multiMonitor', 'ultraWidescreen', 'fourKUltraHd',
            'fov', 'windowed', 'borderlessWindowed', 'anisotropic', 'antiAliasing',
            'upscaling', 'frameGen', 'vsync', 'fps60', 'fps120', 'hdr', 'rayTracing', 'colorBlind'
        ];

        let changesCount = 0;

        fields.forEach(field => {
            const val = result[field];
            if (val && (val === 'true' || val === 'false')) {
                 (props.video as any)[field] = val;
                 changesCount++;
            }
        });

        // Special handling for Tech fields
        if (result.upscalingTech) props.video.upscalingTech = result.upscalingTech;
        if (result.frameGenTech) props.video.frameGenTech = result.frameGenTech;

        // Map notes if present/useful
        if (result._notes) {
            if (result._notes.antiAliasing) props.video.antiAliasingNotes = result._notes.antiAliasing;
            if (result._notes.fov) props.video.fovNotes = result._notes.fov;
            if (result._notes.upscaling) props.video.upscalingNotes = result._notes.upscaling;
        }

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


    <Panel header="WSGF Awards & Links" toggleable collapsed>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="flex flex-col gap-2">
          <label class="font-medium text-surface-700 dark:text-surface-200">WSGF Link</label>
          <InputText v-model="video.wsgfLink" placeholder="http://..." />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-medium text-surface-700 dark:text-surface-200">Widescreen Award</label>
          <InputText v-model="video.widescreenWsgfAward" placeholder="Gold, Silver..." />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-medium text-surface-700 dark:text-surface-200">Multi-monitor Award</label>
          <InputText v-model="video.multiMonitorWsgfAward" placeholder="Gold, Silver..." />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-medium text-surface-700 dark:text-surface-200">Ultra-widescreen Award</label>
          <InputText v-model="video.ultraWidescreenWsgfAward" placeholder="Gold, Silver..." />
        </div>
        <div class="flex flex-col gap-2">
          <label class="font-medium text-surface-700 dark:text-surface-200">4K Ultra HD Award</label>
          <InputText v-model="video.fourKUltraHdWsgfAward" placeholder="Gold, Silver..." />
        </div>
      </div>
    </Panel>

    <Panel header="Resolution & Display" toggleable>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="Monitor" label="Widescreen Resolution" v-model:value="video.widescreenResolution" v-model:notes="video.widescreenResolutionNotes" v-model:reference="video.widescreenResolutionRef" />
        <RatingRow :icon="Grid2X2" label="Multi-monitor" v-model:value="video.multiMonitor" v-model:notes="video.multiMonitorNotes" v-model:reference="video.multiMonitorRef" />
        <RatingRow :icon="Maximize" label="Ultra-widescreen" v-model:value="video.ultraWidescreen" v-model:notes="video.ultraWidescreenNotes" v-model:reference="video.ultraWidescreenRef" />
        <RatingRow :icon="Star" label="4K Ultra HD" v-model:value="video.fourKUltraHd" v-model:notes="video.fourKUltraHdNotes" v-model:reference="video.fourKUltraHdRef" />
        <RatingRow :icon="Eye" label="FOV" v-model:value="video.fov" v-model:notes="video.fovNotes" v-model:reference="video.fovRef" />
        <RatingRow :icon="Minimize" label="Windowed" v-model:value="video.windowed" v-model:notes="video.windowedNotes" v-model:reference="video.windowedRef" />
        <RatingRow :icon="Image" label="Borderless Windowed" v-model:value="video.borderlessWindowed" v-model:notes="video.borderlessWindowedNotes" v-model:reference="video.borderlessWindowedRef" />
      </div>
    </Panel>

    <Panel header="Graphics Settings" toggleable>
      <div class="flex flex-col gap-2">
        <RatingRow :icon="ScanLine" label="Anisotropic Filtering" v-model:value="video.anisotropic" v-model:notes="video.anisotropicNotes" v-model:reference="video.anisotropicRef" />
        <RatingRow :icon="LineChart" label="Anti-aliasing" v-model:value="video.antiAliasing" v-model:notes="video.antiAliasingNotes" v-model:reference="video.antiAliasingRef" />
        
        <!-- Upscaling with Tech -->
        <div class="flex flex-col gap-2 bg-surface-50 dark:bg-surface-900/50 p-2 rounded border border-surface-200 dark:border-surface-800">
            <RatingRow :icon="ArrowUpRight" label="Upscaling" v-model:value="video.upscaling" v-model:notes="video.upscalingNotes" v-model:reference="video.upscalingRef" />
            <div class="pl-[200px] pr-4 pb-2" v-if="video.upscaling !== 'false' && video.upscaling !== 'unknown' && video.upscaling !== 'n/a'">
                <InputText v-model="video.upscalingTech" placeholder="Tech (e.g. DLSS 2, FSR 2)" class="w-full" />
            </div>
        </div>

        <!-- Frame Gen with Tech -->
        <div class="flex flex-col gap-2 bg-surface-50 dark:bg-surface-900/50 p-2 rounded border border-surface-200 dark:border-surface-800">
             <RatingRow :icon="FastForward" label="Frame Generation" v-model:value="video.frameGen" v-model:notes="video.frameGenNotes" v-model:reference="video.frameGenRef" />
             <div class="pl-[200px] pr-4 pb-2" v-if="video.frameGen !== 'false' && video.frameGen !== 'unknown' && video.frameGen !== 'n/a'">
                 <InputText v-model="video.frameGenTech" placeholder="Tech (e.g. DLSS 3, FSR 3)" class="w-full" />
             </div>
        </div>

        <RatingRow :icon="RefreshCcw" label="VSync" v-model:value="video.vsync" v-model:notes="video.vsyncNotes" v-model:reference="video.vsyncRef" />
        <RatingRow :icon="Clock" label="60 FPS" v-model:value="video.fps60" v-model:notes="video.fps60Notes" v-model:reference="video.fps60Ref" />
        <RatingRow :icon="Zap" label="120+ FPS" v-model:value="video.fps120" v-model:notes="video.fps120Notes" v-model:reference="video.fps120Ref" />
        <RatingRow :icon="Sun" label="HDR" v-model:value="video.hdr" v-model:notes="video.hdrNotes" v-model:reference="video.hdrRef" />
        <RatingRow :icon="Sparkles" label="Ray Tracing" v-model:value="video.rayTracing" v-model:notes="video.rayTracingNotes" v-model:reference="video.rayTracingRef" />
        <RatingRow :icon="Palette" label="Color Blind Mode" v-model:value="video.colorBlind" v-model:notes="video.colorBlindNotes" v-model:reference="video.colorBlindRef" />
      </div>
    </Panel>
  </div>
</template>
