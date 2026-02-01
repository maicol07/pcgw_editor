<script setup lang="ts">
import { SettingsVideo } from '../models/GameData';
import RatingRow from './RatingRow.vue';
import Panel from 'primevue/panel';
import InputText from 'primevue/inputtext';

defineProps<{
  video: SettingsVideo;
}>();
</script>

<template>
  <div class="flex flex-col gap-6">
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
        <RatingRow icon="pi pi-desktop" label="Widescreen Resolution" v-model:value="video.widescreenResolution" v-model:notes="video.widescreenResolutionNotes" v-model:reference="video.widescreenResolutionRef" />
        <RatingRow icon="pi pi-th-large" label="Multi-monitor" v-model:value="video.multiMonitor" v-model:notes="video.multiMonitorNotes" v-model:reference="video.multiMonitorRef" />
        <RatingRow icon="pi pi-window-maximize" label="Ultra-widescreen" v-model:value="video.ultraWidescreen" v-model:notes="video.ultraWidescreenNotes" v-model:reference="video.ultraWidescreenRef" />
        <RatingRow icon="pi pi-star" label="4K Ultra HD" v-model:value="video.fourKUltraHd" v-model:notes="video.fourKUltraHdNotes" v-model:reference="video.fourKUltraHdRef" />
        <RatingRow icon="pi pi-eye" label="FOV" v-model:value="video.fov" v-model:notes="video.fovNotes" v-model:reference="video.fovRef" />
        <RatingRow icon="pi pi-window-minimize" label="Windowed" v-model:value="video.windowed" v-model:notes="video.windowedNotes" v-model:reference="video.windowedRef" />
        <RatingRow icon="pi pi-image" label="Borderless Windowed" v-model:value="video.borderlessWindowed" v-model:notes="video.borderlessWindowedNotes" v-model:reference="video.borderlessWindowedRef" />
      </div>
    </Panel>

    <Panel header="Graphics Settings" toggleable>
      <div class="flex flex-col gap-2">
        <RatingRow icon="pi pi-sort-amount-up" label="Anisotropic Filtering" v-model:value="video.anisotropic" v-model:notes="video.anisotropicNotes" v-model:reference="video.anisotropicRef" />
        <RatingRow icon="pi pi-chart-line" label="Anti-aliasing" v-model:value="video.antiAliasing" v-model:notes="video.antiAliasingNotes" v-model:reference="video.antiAliasingRef" />
        
        <!-- Upscaling with Tech -->
        <div class="flex flex-col gap-2 bg-surface-50 dark:bg-surface-900/50 p-2 rounded border border-surface-200 dark:border-surface-800">
            <RatingRow icon="pi pi-arrow-up-right" label="Upscaling" v-model:value="video.upscaling" v-model:notes="video.upscalingNotes" v-model:reference="video.upscalingRef" />
            <div class="pl-[200px] pr-4 pb-2" v-if="video.upscaling !== 'false' && video.upscaling !== 'unknown' && video.upscaling !== 'n/a'">
                <InputText v-model="video.upscalingTech" placeholder="Tech (e.g. DLSS 2, FSR 2)" class="w-full" />
            </div>
        </div>

        <!-- Frame Gen with Tech -->
        <div class="flex flex-col gap-2 bg-surface-50 dark:bg-surface-900/50 p-2 rounded border border-surface-200 dark:border-surface-800">
             <RatingRow icon="pi pi-fast-forward" label="Frame Generation" v-model:value="video.frameGen" v-model:notes="video.frameGenNotes" v-model:reference="video.frameGenRef" />
             <div class="pl-[200px] pr-4 pb-2" v-if="video.frameGen !== 'false' && video.frameGen !== 'unknown' && video.frameGen !== 'n/a'">
                 <InputText v-model="video.frameGenTech" placeholder="Tech (e.g. DLSS 3, FSR 3)" class="w-full" />
             </div>
        </div>

        <RatingRow icon="pi pi-sync" label="VSync" v-model:value="video.vsync" v-model:notes="video.vsyncNotes" v-model:reference="video.vsyncRef" />
        <RatingRow icon="pi pi-clock" label="60 FPS" v-model:value="video.fps60" v-model:notes="video.fps60Notes" v-model:reference="video.fps60Ref" />
        <RatingRow icon="pi pi-bolt" label="120+ FPS" v-model:value="video.fps120" v-model:notes="video.fps120Notes" v-model:reference="video.fps120Ref" />
        <RatingRow icon="pi pi-sun" label="HDR" v-model:value="video.hdr" v-model:notes="video.hdrNotes" v-model:reference="video.hdrRef" />
        <RatingRow icon="pi pi-sparkles" label="Ray Tracing" v-model:value="video.rayTracing" v-model:notes="video.rayTracingNotes" v-model:reference="video.rayTracingRef" />
        <RatingRow icon="pi pi-palette" label="Color Blind Mode" v-model:value="video.colorBlind" v-model:notes="video.colorBlindNotes" v-model:reference="video.colorBlindRef" />
      </div>
    </Panel>
  </div>
</template>
