<script setup lang="ts">
import { inject, type Ref, toRefs } from 'vue';
import { SettingsVideo } from '../models/GameData';
import RatingRow from './RatingRow.vue';
import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';
import {
    Monitor, Grid2X2, Maximize, Star, Eye, Minimize, Image,
    ScanLine, LineChart, ArrowUpRight, FastForward, RefreshCcw,
    Clock, Zap, Sun, Sparkles, Palette
} from 'lucide-vue-next';
import { useVideoAnalysis } from '../features/video/useVideoAnalysis';
import VideoAnalysis from '../features/video/VideoAnalysis.vue';

const props = defineProps<{
    video: SettingsVideo;
}>();

const { video } = toRefs(props);
const geminiApiKey = inject<Ref<string>>('geminiApiKey');

const {
    isAnalyzing, error, analysisSuccess, analyzeScreenshot
} = useVideoAnalysis(video);

const handlePaste = async (event: ClipboardEvent) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
        if (item.type.indexOf('image') !== -1) {
            const blob = item.getAsFile();
            if (blob) await analyzeScreenshot(blob);
            break;
        }
    }
};
</script>

<template>
    <div class="flex flex-col gap-6" @paste="handlePaste">
        <VideoAnalysis :is-analyzing="isAnalyzing" :error="error" :analysis-success="analysisSuccess"
            :gemini-api-key="geminiApiKey?.value || null" @analyze="analyzeScreenshot" />

        <Panel header="WSGF Awards & Links" toggleable collapsed>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm font-medium">
                <div class="flex flex-col gap-2">
                    <label class="text-surface-700 dark:text-surface-200">WSGF Link</label>
                    <InputText v-model="video.wsgfLink" placeholder="http://..." />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-surface-700 dark:text-surface-200">Widescreen Award</label>
                    <InputText v-model="video.widescreenWsgfAward" placeholder="Gold, Silver..." />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-surface-700 dark:text-surface-200">Multi-monitor Award</label>
                    <InputText v-model="video.multiMonitorWsgfAward" placeholder="Gold, Silver..." />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-surface-700 dark:text-surface-200">Ultra-widescreen Award</label>
                    <InputText v-model="video.ultraWidescreenWsgfAward" placeholder="Gold, Silver..." />
                </div>
                <div class="flex flex-col gap-2">
                    <label class="text-surface-700 dark:text-surface-200">4K Ultra HD Award</label>
                    <InputText v-model="video.fourKUltraHdWsgfAward" placeholder="Gold, Silver..." />
                </div>
            </div>
        </Panel>

        <Panel header="Resolution & Display" toggleable>
            <div class="flex flex-col gap-2">
                <RatingRow :icon="Monitor" label="Widescreen Resolution" v-model:value="video.widescreenResolution"
                    v-model:notes="video.widescreenResolutionNotes" v-model:reference="video.widescreenResolutionRef" />
                <RatingRow :icon="Grid2X2" label="Multi-monitor" v-model:value="video.multiMonitor"
                    v-model:notes="video.multiMonitorNotes" v-model:reference="video.multiMonitorRef" />
                <RatingRow :icon="Maximize" label="Ultra-widescreen" v-model:value="video.ultraWidescreen"
                    v-model:notes="video.ultraWidescreenNotes" v-model:reference="video.ultraWidescreenRef" />
                <RatingRow :icon="Star" label="4K Ultra HD" v-model:value="video.fourKUltraHd"
                    v-model:notes="video.fourKUltraHdNotes" v-model:reference="video.fourKUltraHdRef" />
                <RatingRow :icon="Eye" label="FOV" v-model:value="video.fov" v-model:notes="video.fovNotes"
                    v-model:reference="video.fovRef" />
                <RatingRow :icon="Minimize" label="Windowed" v-model:value="video.windowed"
                    v-model:notes="video.windowedNotes" v-model:reference="video.windowedRef" />
                <RatingRow :icon="Image" label="Borderless Windowed" v-model:value="video.borderlessWindowed"
                    v-model:notes="video.borderlessWindowedNotes" v-model:reference="video.borderlessWindowedRef" />
            </div>
        </Panel>

        <Panel header="Graphics Settings" toggleable>
            <div class="flex flex-col gap-2">
                <RatingRow :icon="ScanLine" label="Anisotropic Filtering" v-model:value="video.anisotropic"
                    v-model:notes="video.anisotropicNotes" v-model:reference="video.anisotropicRef" />
                <RatingRow :icon="LineChart" label="Anti-aliasing" v-model:value="video.antiAliasing"
                    v-model:notes="video.antiAliasingNotes" v-model:reference="video.antiAliasingRef" />

                <div
                    class="flex flex-col gap-2 bg-surface-50 dark:bg-surface-900/50 p-2 rounded border border-surface-200 dark:border-surface-800">
                    <RatingRow :icon="ArrowUpRight" label="Upscaling" v-model:value="video.upscaling"
                        v-model:notes="video.upscalingNotes" v-model:reference="video.upscalingRef" />
                    <div class="pl-[160px] md:pl-[200px] pr-4 pb-1"
                        v-if="!['false', 'unknown', 'n/a'].includes(video.upscaling)">
                        <InputText v-model="video.upscalingTech" placeholder="Tech (e.g. DLSS 2, FSR 2)"
                            class="w-full !text-sm" />
                    </div>
                </div>

                <div
                    class="flex flex-col gap-2 bg-surface-50 dark:bg-surface-900/50 p-2 rounded border border-surface-200 dark:border-surface-800">
                    <RatingRow :icon="FastForward" label="Frame Generation" v-model:value="video.frameGen"
                        v-model:notes="video.frameGenNotes" v-model:reference="video.frameGenRef" />
                    <div class="pl-[160px] md:pl-[200px] pr-4 pb-1"
                        v-if="!['false', 'unknown', 'n/a'].includes(video.frameGen)">
                        <InputText v-model="video.frameGenTech" placeholder="Tech (e.g. DLSS 3, FSR 3)"
                            class="w-full !text-sm" />
                    </div>
                </div>

                <RatingRow :icon="RefreshCcw" label="VSync" v-model:value="video.vsync" v-model:notes="video.vsyncNotes"
                    v-model:reference="video.vsyncRef" />
                <RatingRow :icon="Clock" label="60 FPS" v-model:value="video.fps60" v-model:notes="video.fps60Notes"
                    v-model:reference="video.fps60Ref" />
                <RatingRow :icon="Zap" label="120+ FPS" v-model:value="video.fps120" v-model:notes="video.fps120Notes"
                    v-model:reference="video.fps120Ref" />
                <RatingRow :icon="Sun" label="HDR" v-model:value="video.hdr" v-model:notes="video.hdrNotes"
                    v-model:reference="video.hdrRef" />
                <RatingRow :icon="Sparkles" label="Ray Tracing" v-model:value="video.rayTracing"
                    v-model:notes="video.rayTracingNotes" v-model:reference="video.rayTracingRef" />
                <RatingRow :icon="Palette" label="Color Blind Mode" v-model:value="video.colorBlind"
                    v-model:notes="video.colorBlindNotes" v-model:reference="video.colorBlindRef" />
            </div>
        </Panel>
    </div>
</template>
